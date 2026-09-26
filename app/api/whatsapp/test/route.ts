import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"
const GRAPH = `https://graph.facebook.com/${API_VERSION}`

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const schoolId = auth.profile.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "No school is linked to this account." }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from("school_whatsapp")
    .select("id, access_token, phone_number_id, business_account_id, phone_number, display_name")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (!data?.access_token || !data.phone_number_id) {
    return NextResponse.json(
      { error: "No WhatsApp number is connected for this school. Please connect WhatsApp first." },
      { status: 404 }
    )
  }

  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()

  // ── Step 1: Token Health Check ──────────────────────────────────────────────
  let grantedScopes: string[] = []
  if (appId && appSecret) {
    try {
      const debugUrl = new URL(`${GRAPH}/debug_token`)
      debugUrl.searchParams.set("input_token", data.access_token)
      debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`)

      const debugRes = await fetch(debugUrl, { cache: "no-store" })
      const debugData = await debugRes.json()

      if (!debugRes.ok || !debugData?.data?.is_valid) {
        const err = debugData?.error || {}
        console.error("[WhatsApp test] Token debug validation failed:", {
          status: debugRes.status,
          code: err.code,
          message: err.message,
        })
        return NextResponse.json(
          {
            error: `Validation Step 1 (Token Validity) failed: The stored access token is expired or invalid. Meta response: ${err.message || "Token is invalid"}. Please Reconnect WhatsApp.`,
            step: "token_validity",
          },
          { status: 400 }
        )
      }

      grantedScopes = debugData.data.scopes || []
      console.log("[WhatsApp test] Token is valid. Scopes:", grantedScopes)
    } catch (debugErr) {
      console.warn("[WhatsApp test] Token debug check non-fatal error:", debugErr)
    }
  }

  // ── Step 2: WABA Access Check (if WABA ID is configured) ────────────────────
  let verifiedWabaName: string | null = null
  if (data.business_account_id) {
    try {
      const wabaUrl = new URL(`${GRAPH}/${data.business_account_id}`)
      wabaUrl.searchParams.set("fields", "id,name")

      const wabaRes = await fetch(wabaUrl, {
        headers: { Authorization: `Bearer ${data.access_token}` },
        cache: "no-store",
      })
      const wabaResult = await wabaRes.json()

      if (!wabaRes.ok) {
        const err = wabaResult?.error || {}
        console.error("[WhatsApp test] WABA check failed:", {
          status: wabaRes.status,
          code: err.code,
          subcode: err.error_subcode,
          message: err.message,
        })
        return NextResponse.json(
          {
            error: `Validation Step 2 (WABA Access) failed: Cannot access WhatsApp Business Account (${data.business_account_id}). Meta Error [Code ${err.code || "unknown"}]: ${err.message || "Access denied"}. Granted scopes: [${grantedScopes.join(", ") || "none"}].`,
            step: "waba_access",
            metaCode: err.code,
            metaSubcode: err.error_subcode,
          },
          { status: 400 }
        )
      }

      verifiedWabaName = wabaResult.name || null
      console.log("[WhatsApp test] WABA verified:", data.business_account_id, verifiedWabaName)
    } catch (wabaErr) {
      console.warn("[WhatsApp test] WABA check network warning:", wabaErr)
    }
  }

  // ── Step 3: Phone Number Access Check ───────────────────────────────────────
  try {
    const phoneUrl = new URL(`${GRAPH}/${data.phone_number_id}`)
    phoneUrl.searchParams.set("fields", "id,display_phone_number,verified_name,quality_rating")

    console.log("[WhatsApp test] Step 3: verifying phone_number_id:", data.phone_number_id)

    const phoneRes = await fetch(phoneUrl, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: "no-store",
    })
    const phoneResult = await phoneRes.json()

    if (!phoneRes.ok) {
      const err = phoneResult?.error || {}
      console.error("[WhatsApp test] Step 3: Phone verification failed:", {
        status: phoneRes.status,
        code: err.code,
        subcode: err.error_subcode,
        type: err.type,
        message: err.message,
        fbtrace_id: err.fbtrace_id,
        grantedScopes,
      })

      if (err.error_subcode === 33 || /missing permissions|Unsupported get request/i.test(err.message || "")) {
        return NextResponse.json(
          {
            error: `Validation Step 3 (Phone Access) failed: Permission missing. The stored token does not have permission to access WhatsApp Phone Number (${data.phone_number_id}). Meta Error [Code ${err.code}, Subcode ${err.error_subcode}]: ${err.message}. Granted scopes: [${grantedScopes.join(", ") || "none"}]. Please click Reconnect to authorize with WhatsApp permissions.`,
            step: "phone_access",
            metaCode: err.code,
            metaSubcode: err.error_subcode,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: `Validation Step 3 (Phone Access) failed: Meta Error [Code ${err.code || "unknown"}]: ${err.message || "Meta rejected the phone number check"}.`,
          step: "phone_access",
          metaCode: err.code,
        },
        { status: 400 }
      )
    }

    // ── Step 4: Refresh Display Data in Database ──────────────────────────────
    const verifiedPhone = phoneResult.display_phone_number || data.phone_number
    const verifiedDisplay = phoneResult.verified_name || verifiedWabaName || data.display_name

    if (verifiedPhone || verifiedDisplay) {
      await supabaseAdmin
        .from("school_whatsapp")
        .update({
          phone_number: verifiedPhone,
          display_name: verifiedDisplay,
        })
        .eq("id", data.id)
    }

    console.log("[WhatsApp test] All verification steps passed successfully for school:", schoolId)

    return NextResponse.json({
      success: true,
      phoneNumber: verifiedPhone || data.phone_number_id,
      displayName: verifiedDisplay || null,
      wabaName: verifiedWabaName || null,
      qualityRating: phoneResult.quality_rating || null,
      grantedScopes,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The connected WhatsApp number could not be verified."
    console.error("[WhatsApp test] unexpected exception:", message)
    return NextResponse.json({ error: message, step: "unexpected_error" }, { status: 400 })
  }
}
