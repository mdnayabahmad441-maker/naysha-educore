import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const GRAPH = `https://graph.facebook.com/${API_VERSION}`
const STATE_COOKIE = "wa_embedded_signup"

type SignupState = { schoolId?: string; nonce?: string }

function clientError(error: unknown): string {
  const message = error instanceof Error ? error.message : "WhatsApp connection could not be completed."
  console.error("[WhatsApp/callback] internal error:", message)
  if (/server configuration/i.test(message)) {
    return "WhatsApp onboarding is not configured on this server (META_APP_ID or META_APP_SECRET missing in environment variables)."
  }
  // Keep Meta's detailed phone lookup errors visible. Only use the generic
  // message when resolution genuinely ended without a phone ID.
  if (/^No WhatsApp phone number was selected or found in Meta\.?$/i.test(message)) {
    return "No WhatsApp phone number was selected or found in Meta."
  }
  if (/^No WhatsApp Business Account was selected or found in Meta\.?$/i.test(message)) {
    return "No WhatsApp Business Account was selected or found in Meta."
  }
  return message
}

async function graphGet(path: string, token: string, fields?: string) {
  const url = new URL(`${GRAPH}${path}`)
  if (fields) url.searchParams.set("fields", fields)
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.error?.message || `Meta Graph API request failed for ${path}`)
  }
  return data
}

async function exchangeCode(code: string): Promise<string> {
  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()
  if (!appId || !appSecret) {
    throw new Error("WhatsApp server configuration is incomplete (META_APP_ID / META_APP_SECRET missing)")
  }

  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("code", code)
  // IMPORTANT: Do NOT pass redirect_uri here.
  // Meta WhatsApp Embedded Signup using the Facebook JS SDK (FB.login) does not use
  // redirect_uri. Providing a redirect_uri at code exchange causes Meta to reject
  // the request with OAuthException 191 (domain not in app domains).

  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()

  console.log(
    "[WhatsApp/callback] token exchange status:",
    response.status,
    "has_token:",
    Boolean(data?.access_token)
  )

  if (!response.ok || !data?.access_token) {
    const errMsg = data?.error?.message || `Meta authorization code exchange failed (HTTP ${response.status})`
    throw new Error(errMsg)
  }
  return String(data.access_token)
}

async function resolvePhoneNumber(
  accessToken: string,
  suppliedWaba?: string,
  suppliedPhone?: string
): Promise<{ wabaId: string; phone: { id: string; display_phone_number?: string; verified_name?: string } }> {
  let wabaId = suppliedWaba
  let phone: { id: string; display_phone_number?: string; verified_name?: string } | null = null

  // 1. If phone_number_id was supplied directly by the client (from FINISH event)
  if (suppliedPhone) {
    try {
      // Request the fields explicitly; Graph API nodes do not always include
      // their identifying fields in the default response.
      const phoneDetails = await graphGet(
        `/${suppliedPhone}`,
        accessToken,
        "id,display_phone_number,verified_name"
      )
      if (phoneDetails?.id) {
        phone = {
          id: phoneDetails.id,
          display_phone_number: phoneDetails.display_phone_number,
          verified_name: phoneDetails.verified_name,
        }
        console.log("[WhatsApp/callback] direct phone details verified:", phone.display_phone_number || phone.id)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error("[WhatsApp/callback] Direct phone verification failed:", message)
      if (/missing permissions|Unsupported get request|\(#200\)/i.test(message)) {
        throw new Error(
          `Permission missing: The token granted by Meta does not have permission to access WhatsApp Phone Number (${suppliedPhone}). Please ensure configuration ${process.env.META_WHATSAPP_CONFIG_ID || ""} in Meta Developer Dashboard includes 'whatsapp_business_management' and 'whatsapp_business_messaging'.`
        )
      }
      throw new Error(`WhatsApp Phone Number verification failed: ${message}`)
    }
  }

  // 2. If wabaId is not yet resolved, inspect debug_token using app access token
  if (!wabaId) {
    const appId = process.env.META_APP_ID?.trim()
    const appSecret = process.env.META_APP_SECRET?.trim()
    if (appId && appSecret) {
      try {
        const debugUrl = new URL(`${GRAPH}/debug_token`)
        debugUrl.searchParams.set("input_token", accessToken)
        debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`)
        const debugRes = await fetch(debugUrl, { cache: "no-store" })
        const debugData = await debugRes.json()
        const scopes = debugData?.data?.granular_scopes
        if (Array.isArray(scopes)) {
          const wabaScope = scopes.find(
            (s: { scope?: string }) =>
              s.scope === "whatsapp_business_management" || s.scope === "whatsapp_business_messaging"
          )
          if (wabaScope?.target_ids?.length) {
            wabaId = wabaScope.target_ids[0]
            console.log("[WhatsApp/callback] WABA resolved via debug_token:", wabaId)
          }
        }
      } catch (err) {
        console.warn("[WhatsApp/callback] debug_token lookup warning:", err)
      }
    }
  }

  // 3. Fallback: query WABA phone numbers list if phone was not supplied
  if (!phone?.id && wabaId) {
    try {
      // Omit restricted fields (e.g. status) to avoid Meta (#200) field permission errors
      const phonesRes = await graphGet(
        `/${wabaId}/phone_numbers`,
        accessToken,
        "id,display_phone_number,verified_name"
      )
      const phoneList = phonesRes?.data || []
      if (phoneList.length > 0) {
        phone = {
          id: phoneList[0].id,
          display_phone_number: phoneList[0].display_phone_number,
          verified_name: phoneList[0].verified_name,
        }
      }
    } catch (err) {
      console.warn("[WhatsApp/callback] WABA phone_numbers query warning:", err)
    }
  }

  if (!phone?.id) {
    throw new Error("No WhatsApp phone number was selected or found in Meta. Please try again.")
  }

  return { wabaId: String(wabaId || ""), phone }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const schoolId = auth.profile.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "No school is linked to this admin account." }, { status: 400 })
  }

  try {
    // ── Session cookie validation ─────────────────────────────────────────────
    const rawState = request.cookies.get(STATE_COOKIE)?.value
    const state = rawState ? (JSON.parse(rawState) as SignupState) : null

    if (state) {
      if (!state.nonce || state.schoolId !== schoolId) {
        console.warn("[WhatsApp/callback] cookie school mismatch or missing nonce — rejecting")
        return NextResponse.json(
          { error: "This WhatsApp connection session has expired. Please start again." },
          { status: 400 }
        )
      }
      console.log("[WhatsApp/callback] session cookie validated for school:", schoolId)
    } else {
      console.log("[WhatsApp/callback] session cookie absent; proceeding with auth-verified schoolId:", schoolId)
    }

    // ── Parse request body ────────────────────────────────────────────────────
    const body = await request.json()
    const code = typeof body?.code === "string" ? body.code.trim() : ""
    const suppliedWaba = typeof body?.wabaId === "string" ? body.wabaId.trim() : undefined
    const suppliedPhone = typeof body?.phoneNumberId === "string" ? body.phoneNumberId.trim() : undefined

    console.log(
      "[WhatsApp/callback] received — has_code:",
      Boolean(code),
      "has_waba:",
      Boolean(suppliedWaba),
      "has_phone:",
      Boolean(suppliedPhone)
    )

    if (!code) {
      return NextResponse.json(
        { error: "Meta did not return an authorization code. Please try again." },
        { status: 400 }
      )
    }

    // ── Step 1: Exchange code for access token ─────────────────────────────────
    const accessToken = await exchangeCode(code)

    // Inspect granted scopes (server-side diagnostic)
    const appId = process.env.META_APP_ID?.trim()
    const appSecret = process.env.META_APP_SECRET?.trim()
    if (appId && appSecret) {
      try {
        const debugUrl = new URL(`${GRAPH}/debug_token`)
        debugUrl.searchParams.set("input_token", accessToken)
        debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`)
        const debugRes = await fetch(debugUrl, { cache: "no-store" })
        const debugData = await debugRes.json()
        const scopes = debugData?.data?.scopes || []
        console.log("[WhatsApp/callback] token scopes granted by Meta:", scopes)
        if (!scopes.includes("whatsapp_business_management") && !scopes.includes("whatsapp_business_messaging")) {
          console.warn("[WhatsApp/callback] WARNING: Token missing WhatsApp permissions! Granted scopes:", scopes)
        }
      } catch (err) {
        console.warn("[WhatsApp/callback] debug_token scope check warning:", err)
      }
    }

    // ── Step 2: Resolve WABA ID and Phone Number ──────────────────────────────
    const selected = await resolvePhoneNumber(accessToken, suppliedWaba, suppliedPhone)

    // ── Step 3: Subscribe app to WABA webhooks (non-fatal) ─────────────────────
    if (selected.wabaId) {
      try {
        const subscription = await fetch(`${GRAPH}/${selected.wabaId}/subscribed_apps`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          cache: "no-store",
        })
        if (!subscription.ok) {
          const subData = await subscription.json().catch(() => null)
          console.warn("[WhatsApp/callback] subscribed_apps non-fatal warning:", subData?.error?.message)
        } else {
          console.log("[WhatsApp/callback] subscribed_apps OK for WABA:", selected.wabaId)
        }
      } catch (subErr) {
        console.warn("[WhatsApp/callback] subscribed_apps network warning:", subErr)
      }
    }

    // ── Step 4: Persist connection to database ─────────────────────────────────
    // Query existing record to handle update vs insert safely without relying on a
    // specific unique constraint name on school_id. Only existing columns are used.
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("school_whatsapp")
      .select("id")
      .eq("school_id", schoolId)
      .maybeSingle()

    if (selectError) {
      console.warn("[WhatsApp/callback] DB select warning:", selectError.message)
    }

    const payload = {
      access_token: accessToken,
      phone_number_id: selected.phone.id,
      business_account_id: selected.wabaId || null,
      phone_number: selected.phone.display_phone_number ?? null,
      display_name: selected.phone.verified_name ?? null,
    }

    if (existing?.id) {
      const { error: updateError } = await supabaseAdmin
        .from("school_whatsapp")
        .update(payload)
        .eq("id", existing.id)

      if (updateError) {
        console.error("[WhatsApp/callback] DB update error:", updateError.message)
        throw new Error(`Database error: ${updateError.message}`)
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("school_whatsapp")
        .insert({
          school_id: schoolId,
          ...payload,
        })

      if (insertError) {
        console.error("[WhatsApp/callback] DB insert error:", insertError.message)
        throw new Error(`Database error: ${insertError.message}`)
      }
    }

    console.log(
      "[WhatsApp/callback] successfully connected school:",
      schoolId,
      "phone:",
      selected.phone.display_phone_number || selected.phone.id
    )

    const response = NextResponse.json({ success: true })
    response.cookies.set(STATE_COOKIE, "", {
      maxAge: 0,
      path: "/api/whatsapp",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    return response
  } catch (error) {
    return NextResponse.json({ error: clientError(error) }, { status: 400 })
  }
}
