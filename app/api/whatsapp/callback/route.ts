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
  if (/phone number/i.test(message)) {
    return "No WhatsApp phone number was selected or found in Meta."
  }
  if (/business account|waba/i.test(message)) {
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

  if (!wabaId) {
    // Attempt 1: inspect debug_token using app access token
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
        console.warn("[WhatsApp/callback] debug_token lookup failed:", err)
      }
    }
  }

  if (!wabaId) {
    // Attempt 2: query /me/whatsapp_business_accounts
    try {
      const accounts = await graphGet("/me/whatsapp_business_accounts", accessToken, "id,name")
      wabaId = accounts?.data?.[0]?.id
      console.log("[WhatsApp/callback] WABA resolved via /me:", wabaId || "not found")
    } catch (err) {
      console.warn("[WhatsApp/callback] /me/whatsapp_business_accounts lookup failed:", err)
    }
  }

  if (!wabaId) {
    throw new Error("No WhatsApp Business Account was selected or found in Meta.")
  }

  const phones = await graphGet(
    `/${wabaId}/phone_numbers`,
    accessToken,
    "id,display_phone_number,verified_name,status"
  )

  const phoneList = phones?.data || []
  const phone = suppliedPhone
    ? phoneList.find((item: { id?: string }) => item.id === suppliedPhone)
    : phoneList[0]

  console.log(
    "[WhatsApp/callback] phone resolved:",
    phone?.id ? `id=${phone.id}` : "not found",
    "total_numbers:",
    phoneList.length
  )

  if (!phone?.id) {
    throw new Error("No WhatsApp phone number was found in the selected Business Account.")
  }

  return { wabaId: String(wabaId), phone }
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

    // ── Step 2: Resolve WABA ID and Phone Number ──────────────────────────────
    const selected = await resolvePhoneNumber(accessToken, suppliedWaba, suppliedPhone)

    // ── Step 3: Subscribe app to WABA webhooks (non-fatal) ─────────────────────
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
      business_account_id: selected.wabaId,
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
      selected.phone.display_phone_number
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
