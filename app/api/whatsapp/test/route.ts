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
    return NextResponse.json({ error: "No WhatsApp number is connected for this school." }, { status: 404 })
  }

  const appId = process.env.META_APP_ID?.trim()
  const appSecret = process.env.META_APP_SECRET?.trim()

  // ── Step 1: Inspect token scopes & granular_scopes (Server-Side Diagnostic) ─
  let grantedScopes: string[] = []
  let granularTargets: Array<{ scope?: string; target_ids?: string[] }> = []
  let tokenType: string | null = null

  if (appId && appSecret) {
    try {
      const debugUrl = new URL(`${GRAPH}/debug_token`)
      debugUrl.searchParams.set("input_token", data.access_token)
      debugUrl.searchParams.set("access_token", `${appId}|${appSecret}`)

      const debugRes = await fetch(debugUrl, { cache: "no-store" })
      const debugData = await debugRes.json()

      const flatScopes: string[] = debugData?.data?.scopes || []
      const granular: Array<{ scope?: string; target_ids?: string[] }> = debugData?.data?.granular_scopes || []
      const granularNames = granular.map((g) => g.scope || "").filter(Boolean)

      grantedScopes = Array.from(new Set([...flatScopes, ...granularNames]))
      granularTargets = granular
      tokenType = debugData?.data?.type || null

      console.log("[WhatsApp test] Token debug result:", {
        isValid: debugData?.data?.is_valid,
        tokenType,
        grantedScopes,
        granularTargets,
      })
    } catch (debugErr) {
      console.warn("[WhatsApp test] debug_token warning:", debugErr)
    }
  }

  // ── Step 2: Validate WABA Access (if business_account_id is known) ───────────
  let verifiedWabaName: string | null = null
  if (data.business_account_id) {
    try {
      const wabaUrl = new URL(`${GRAPH}/${data.business_account_id}`)
      wabaUrl.searchParams.set("fields", "id,name,currency,timezone_id")

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
      console.log("[WhatsApp test] WABA verified successfully:", data.business_account_id, verifiedWabaName)
    } catch (wabaErr) {
      console.warn("[WhatsApp test] WABA check network warning:", wabaErr)
    }
  }

  // ── Step 3: Validate Phone Number Access ─────────────────────────────────────
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
            error: `Validation Step 3 (Phone Access) failed: The stored token does not have permission to access WhatsApp Phone Number (${data.phone_number_id}). Meta Error [Code ${err.code}, Subcode ${err.error_subcode}]: ${err.message}. Granted scopes: [${grantedScopes.join(", ") || "none"}]. Please click Reconnect to authorize with WhatsApp permissions.`,
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
