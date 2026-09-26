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
    const err = data?.error || {}
    const msg = err.message || `Meta Graph API request failed for ${path} (HTTP ${response.status})`
    const errorObj = new Error(msg) as Error & { code?: number; subcode?: number; fbtrace_id?: string }
    errorObj.code = err.code
    errorObj.subcode = err.error_subcode
    errorObj.fbtrace_id = err.fbtrace_id
    throw errorObj
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

  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()

  console.log(
    "[WhatsApp/callback] token exchange status:",
    response.status,
    "has_token:",
    Boolean(data?.access_token),
    "token_type:",
    data?.token_type || "unknown"
  )

  if (!response.ok || !data?.access_token) {
    const errMsg = data?.error?.message || `Meta authorization code exchange failed (HTTP ${response.status})`
    throw new Error(errMsg)
  }
  return String(data.access_token)
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
      "wabaId:",
      suppliedWaba ? `[ID: ${suppliedWaba}]` : "none",
      "phoneNumberId:",
      suppliedPhone ? `[ID: ${suppliedPhone}]` : "none"
    )

    if (!code) {
      return NextResponse.json(
        { error: "Meta did not return an authorization code. Please try again." },
        { status: 400 }
      )
    }

    if (!suppliedPhone) {
      return NextResponse.json(
        { error: "No WhatsApp phone number was selected during Meta Embedded Signup. Please try again." },
        { status: 400 }
      )
    }

    // ── Pipeline Step 1: Exchange code for server-side access token ───────────
    const accessToken = await exchangeCode(code)

    // ── Pipeline Step 2: Validate Token Scopes via debug_token ─────────────────
    const appId = process.env.META_APP_ID?.trim()
    const appSecret = process.env.META_APP_SECRET?.trim()
    let grantedScopes: string[] = []
    if (appId && appSecret) {
      try {
        const debugUrl = new URL(`${GRAPH}/debug_token`)
        debugUrl.searchParams.set("input_token", accessToken)
        debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`)
        const debugRes = await fetch(debugUrl, { cache: "no-store" })
        const debugData = await debugRes.json()
        grantedScopes = debugData?.data?.scopes || []
        console.log("[WhatsApp/callback] token debug verification:", {
          type: debugData?.data?.type,
          is_valid: debugData?.data?.is_valid,
          scopes: grantedScopes,
        })
      } catch (debugErr) {
        console.warn("[WhatsApp/callback] debug_token non-fatal warning:", debugErr)
      }
    }

    // ── Pipeline Step 3: Verify Token Can Access WABA ──────────────────────────
    let verifiedWabaName: string | null = null
    if (suppliedWaba) {
      try {
        const wabaData = await graphGet(`/${suppliedWaba}`, accessToken, "id,name")
        verifiedWabaName = wabaData?.name || null
        console.log("[WhatsApp/callback] WABA verified successfully:", suppliedWaba, `(${verifiedWabaName})`)
      } catch (wabaErr) {
        const msg = wabaErr instanceof Error ? wabaErr.message : String(wabaErr)
        console.error("[WhatsApp/callback] Step 3: WABA verification failed:", msg)
        return NextResponse.json(
          {
            error: `WABA access rejected by Meta: The granted token cannot access WhatsApp Business Account (${suppliedWaba}). Reason: ${msg}. Granted scopes: [${grantedScopes.join(", ") || "none"}].`,
          },
          { status: 400 }
        )
      }
    }

    // ── Pipeline Step 4: Verify Token Can Access Phone Number ─────────────────
    let displayPhoneNumber: string | null = null
    let verifiedName: string | null = null

    try {
      const phoneData = await graphGet(`/${suppliedPhone}`, accessToken, "id,display_phone_number,verified_name")
      displayPhoneNumber = phoneData?.display_phone_number || null
      verifiedName = phoneData?.verified_name || null
      console.log("[WhatsApp/callback] Phone number verified successfully:", {
        id: suppliedPhone,
        displayPhoneNumber,
        verifiedName,
      })
    } catch (phoneErr) {
      const msg = phoneErr instanceof Error ? phoneErr.message : String(phoneErr)
      console.error("[WhatsApp/callback] Step 4: Phone verification failed:", msg)
      return NextResponse.json(
        {
          error: `Phone access rejected by Meta: The granted token cannot access WhatsApp Phone Number (${suppliedPhone}). Reason: ${msg}. Granted scopes: [${grantedScopes.join(", ") || "none"}]. Please ensure configuration ${process.env.META_WHATSAPP_CONFIG_ID || ""} in Meta Developer Dashboard includes 'whatsapp_business_management' and 'whatsapp_business_messaging'.`,
        },
        { status: 400 }
      )
    }

    // ── Pipeline Step 5: Subscribe App to WABA Webhooks ───────────────────────
    if (suppliedWaba) {
      try {
        const subscription = await fetch(`${GRAPH}/${suppliedWaba}/subscribed_apps`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          cache: "no-store",
        })
        if (!subscription.ok) {
          const subData = await subscription.json().catch(() => null)
          console.warn("[WhatsApp/callback] subscribed_apps non-fatal warning:", subData?.error?.message)
        } else {
          console.log("[WhatsApp/callback] subscribed_apps OK for WABA:", suppliedWaba)
        }
      } catch (subErr) {
        console.warn("[WhatsApp/callback] subscribed_apps network warning:", subErr)
      }
    }

    // ── Pipeline Step 6: ONLY NOW Save Validated Connection to Database ────────
    // If we reached this point, the token was fully proven to access both the WABA and the Phone Number.
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
      phone_number_id: suppliedPhone,
      business_account_id: suppliedWaba || null,
      phone_number: displayPhoneNumber,
      display_name: verifiedName || verifiedWabaName || "WhatsApp Business",
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
      "[WhatsApp/callback] successfully connected and verified school:",
      schoolId,
      "phone:",
      displayPhoneNumber
    )

    const response = NextResponse.json({
      success: true,
      phoneNumber: displayPhoneNumber,
      displayName: verifiedName || verifiedWabaName,
    })

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
