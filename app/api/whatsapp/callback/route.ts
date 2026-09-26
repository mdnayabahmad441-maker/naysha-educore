import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const GRAPH = `https://graph.facebook.com/${API_VERSION}`
const STATE_COOKIE = "wa_embedded_signup"

// The Facebook JS SDK (Embedded Signup) exchanges the code against this
// implicit redirect URI — it is not a real page, just a sentinel value that
// Meta requires at token-exchange time when the code was issued via the SDK.
const FB_SDK_REDIRECT_URI = "https://www.facebook.com/connect/login_success.html"

type SignupState = { schoolId?: string; nonce?: string }

function clientError(error: unknown) {
  const message = error instanceof Error ? error.message : "WhatsApp connection could not be completed."
  // Log the full message server-side for debugging, but never log tokens or secrets.
  console.error("[WhatsApp/callback] internal error:", message)
  if (/server configuration/i.test(message)) return "WhatsApp onboarding is not configured on this server. Contact NaySha EduCore support."
  if (/phone number/i.test(message)) return "No WhatsApp phone number was selected in Meta."
  if (/business account|waba/i.test(message)) return "No WhatsApp Business Account was selected in Meta."
  if (/code|token|oauth|access_token/i.test(message)) return "Meta could not authorize this connection. Please start again."
  if (/database/i.test(message)) return "The WhatsApp connection could not be saved. Please try again."
  return "WhatsApp connection could not be completed. Please try again or contact support."
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

async function exchangeCode(code: string) {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error("WhatsApp server configuration is incomplete (META_APP_ID / META_APP_SECRET missing)")
  }

  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set("client_id", appId)
  url.searchParams.set("client_secret", appSecret)
  url.searchParams.set("code", code)
  // The Facebook JS SDK Embedded Signup flow issues the code against this
  // well-known redirect URI. Meta requires it to match at token-exchange time.
  url.searchParams.set("redirect_uri", FB_SDK_REDIRECT_URI)

  const response = await fetch(url, { cache: "no-store" })
  const data = await response.json()

  // Log non-sensitive response fields only.
  console.log("[WhatsApp/callback] token exchange status:", response.status, "token_type:", data?.token_type, "has_token:", Boolean(data?.access_token))

  if (!response.ok || !data?.access_token) {
    throw new Error(data?.error?.message || "Meta authorization code exchange failed")
  }
  return String(data.access_token)
}

async function resolvePhoneNumber(accessToken: string, suppliedWaba?: string, suppliedPhone?: string) {
  let wabaId = suppliedWaba

  if (!wabaId) {
    // Fallback: fetch the first WABA accessible with this token.
    const accounts = await graphGet("/me/whatsapp_business_accounts", accessToken, "id,name")
    wabaId = accounts?.data?.[0]?.id
    console.log("[WhatsApp/callback] WABA resolved from /me:", wabaId || "not found")
  } else {
    console.log("[WhatsApp/callback] WABA supplied by client:", wabaId)
  }

  if (!wabaId) throw new Error("No WhatsApp Business Account was selected in Meta.")

  const phones = await graphGet(
    `/${wabaId}/phone_numbers`,
    accessToken,
    "id,display_phone_number,verified_name,status",
  )

  const phone = suppliedPhone
    ? phones?.data?.find((item: { id?: string }) => item.id === suppliedPhone)
    : phones?.data?.[0]

  console.log("[WhatsApp/callback] phone resolved:", phone?.id ? `id=${phone.id}` : "not found", "total_numbers:", phones?.data?.length ?? 0)

  if (!phone?.id) throw new Error("No WhatsApp phone number was found in the selected Business Account.")
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
    // The cookie is set by /api/whatsapp/connect with path=/api/whatsapp.
    // If it is present, validate the nonce + schoolId binding.
    // If it is absent (can happen when the browser reopens from Meta popup in a
    // different cookie context), fall through and use the authenticated schoolId.
    const rawState = request.cookies.get(STATE_COOKIE)?.value
    const state = rawState ? (JSON.parse(rawState) as SignupState) : null

    if (state) {
      if (!state.nonce || state.schoolId !== schoolId) {
        console.warn("[WhatsApp/callback] cookie school mismatch or missing nonce — rejecting")
        return NextResponse.json(
          { error: "This WhatsApp connection session has expired. Please start again." },
          { status: 400 },
        )
      }
      console.log("[WhatsApp/callback] session cookie validated for school:", schoolId)
    } else {
      // Cookie absent — still safe because the admin auth above already
      // verified the caller's identity and school binding.
      console.log("[WhatsApp/callback] session cookie absent; proceeding with auth-verified schoolId:", schoolId)
    }

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await request.json()
    const code = typeof body?.code === "string" ? body.code.trim() : ""
    const suppliedWaba = typeof body?.wabaId === "string" ? body.wabaId.trim() : undefined
    const suppliedPhone = typeof body?.phoneNumberId === "string" ? body.phoneNumberId.trim() : undefined

    console.log("[WhatsApp/callback] received — has_code:", Boolean(code), "has_waba:", Boolean(suppliedWaba), "has_phone:", Boolean(suppliedPhone))

    if (!code) {
      return NextResponse.json(
        { error: "Meta did not return an authorization code. Please try again." },
        { status: 400 },
      )
    }

    // ── Code → access token ───────────────────────────────────────────────────
    const accessToken = await exchangeCode(code)

    // ── Resolve WABA + phone number ───────────────────────────────────────────
    const selected = await resolvePhoneNumber(accessToken, suppliedWaba, suppliedPhone)

    // ── Subscribe app to WABA webhooks ────────────────────────────────────────
    const subscription = await fetch(`${GRAPH}/${selected.wabaId}/subscribed_apps`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (!subscription.ok) {
      const subData = await subscription.json().catch(() => null)
      console.warn("[WhatsApp/callback] subscribed_apps call failed:", subData?.error?.message)
      // Non-fatal: proceed anyway — webhook subscription can be retried later.
    } else {
      console.log("[WhatsApp/callback] subscribed_apps: OK for WABA:", selected.wabaId)
    }

    // ── Persist to database ───────────────────────────────────────────────────
    const { error: dbError } = await supabaseAdmin.from("school_whatsapp").upsert(
      {
        school_id: schoolId,
        access_token: accessToken,
        phone_number_id: selected.phone.id,
        business_account_id: selected.wabaId,
        phone_number: selected.phone.display_phone_number ?? null,
        display_name: selected.phone.verified_name ?? null,
        status: "connected",
        last_webhook_event_at: null,
        last_webhook_status: "subscribed",
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "school_id" },
    )

    if (dbError) throw new Error(`Database error: ${dbError.message}`)

    console.log("[WhatsApp/callback] successfully connected school:", schoolId, "phone:", selected.phone.display_phone_number)

    const response = NextResponse.json({ success: true })
    // Clear the session cookie whether it was present or not.
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
