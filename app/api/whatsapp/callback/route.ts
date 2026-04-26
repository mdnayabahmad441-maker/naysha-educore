import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseAdmin } from "@/lib/supabase-admin"

const META_APP_ID = process.env.META_APP_ID!
const META_APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = process.env.META_WHATSAPP_REDIRECT_URI!
const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v18.0"
const GRAPH = `https://graph.facebook.com/${API_VERSION}`

// ─── helpers ──────────────────────────────────────────────────────────────────

async function graphGet(path: string, token: string, extra: Record<string, string> = {}) {
  const url = new URL(`${GRAPH}${path}`)
  url.searchParams.set("access_token", token)
  for (const [k, v] of Object.entries(extra)) url.searchParams.set(k, v)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok) {
    const msg = data?.error?.message || `Graph API error on ${path}`
    console.error("[WhatsApp callback] Graph error:", msg, data)
    throw new Error(msg)
  }

  return data
}

async function exchangeCodeForToken(code: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set("client_id", META_APP_ID)
  url.searchParams.set("client_secret", META_APP_SECRET)
  url.searchParams.set("redirect_uri", REDIRECT_URI)
  url.searchParams.set("code", code)

  const res = await fetch(url.toString())
  const data = await res.json()

  if (!res.ok || !data.access_token) {
    throw new Error(data?.error?.message || "Failed to exchange code for access token")
  }

  return data.access_token
}

async function extendToLongLivedToken(shortToken: string): Promise<string> {
  const url = new URL(`${GRAPH}/oauth/access_token`)
  url.searchParams.set("grant_type", "fb_exchange_token")
  url.searchParams.set("client_id", META_APP_ID)
  url.searchParams.set("client_secret", META_APP_SECRET)
  url.searchParams.set("fb_exchange_token", shortToken)

  const res = await fetch(url.toString())
  const data = await res.json()

  // If extension fails we fall back to the short-lived token rather than aborting
  return data.access_token || shortToken
}

// ─── route ────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  const fail    = `${origin}/admin/settings?whatsapp=error`
  const success = `${origin}/admin/settings?whatsapp=connected`

  // ── User cancelled on Meta ─────────────────────────────────────────────────
  if (error) {
    console.warn("[WhatsApp callback] User cancelled OAuth:", error)
    return NextResponse.redirect(fail)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${fail}&reason=missing_params`)
  }

  // ── Validate CSRF state ────────────────────────────────────────────────────
  const cookieStore = await cookies()
  const storedState = cookieStore.get("wa_oauth_state")?.value

  if (!storedState || storedState !== state) {
    console.error("[WhatsApp callback] State mismatch. stored:", storedState, "received:", state)
    return NextResponse.redirect(`${fail}&reason=state_mismatch`)
  }

  const schoolId = state.split("::")[0]
  if (!schoolId) {
    return NextResponse.redirect(`${fail}&reason=invalid_state`)
  }

  // Clear cookie immediately — it is single-use
  cookieStore.delete("wa_oauth_state")

  try {
    // ── Step 1: code → short-lived token ──────────────────────────────────────
    const shortToken = await exchangeCodeForToken(code)

    // ── Step 2: extend to long-lived token (valid 60 days) ────────────────────
    const accessToken = await extendToLongLivedToken(shortToken)

    // ── Step 3: find the Meta Business Account ────────────────────────────────
    const bizRes = await graphGet("/me/businesses", accessToken, { fields: "id,name" })
    const business = bizRes?.data?.[0]

    if (!business) {
      throw new Error(
        "No Meta Business Account found. Make sure your WhatsApp Business Account is connected to a Meta Business Manager and try again."
      )
    }

    // ── Step 4: get WhatsApp Business Account (WABA) ──────────────────────────
    const wabaRes = await graphGet(`/${business.id}/whatsapp_business_accounts`, accessToken, {
      fields: "id,name",
    })
    const waba = wabaRes?.data?.[0]

    if (!waba) {
      throw new Error(
        "No WhatsApp Business Account found under your Business Manager. Add one at business.facebook.com and try again."
      )
    }

    // ── Step 5: get the first phone number in that WABA ───────────────────────
    const phoneRes = await graphGet(`/${waba.id}/phone_numbers`, accessToken, {
      fields: "id,display_phone_number,verified_name,status",
    })
    const phone = phoneRes?.data?.[0]

    if (!phone) {
      throw new Error(
        "No WhatsApp phone number found in your Business Account. Add a phone number and try again."
      )
    }

    // ── Step 6: upsert into school_whatsapp ───────────────────────────────────
    const { error: dbError } = await supabaseAdmin
      .from("school_whatsapp")
      .upsert(
        {
          school_id:           schoolId,
          access_token:        accessToken,
          phone_number_id:     phone.id,
          business_account_id: waba.id,
          phone_number:        phone.display_phone_number ?? null,
          display_name:        phone.verified_name ?? business.name ?? null,
          updated_at:          new Date().toISOString(),
        },
        { onConflict: "school_id" }
      )

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`)
    }

    console.info("[WhatsApp callback] Connected school", schoolId, "→ phone", phone.display_phone_number)
    return NextResponse.redirect(success)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error during WhatsApp connection"
    console.error("[WhatsApp callback] Error:", message)
    return NextResponse.redirect(`${fail}&message=${encodeURIComponent(message)}`)
  }
}
