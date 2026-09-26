import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const schoolId = auth.profile.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "No school is linked to this account." }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from("school_whatsapp")
    .select("id, access_token, phone_number_id")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (!data?.access_token || !data.phone_number_id) {
    return NextResponse.json({ error: "No WhatsApp number is connected for this school." }, { status: 404 })
  }

  try {
    // Query WhatsApp Cloud API for the registered phone number details
    const url = new URL(`https://graph.facebook.com/${API_VERSION}/${data.phone_number_id}`)
    url.searchParams.set("fields", "id,display_phone_number,verified_name")

    console.log("[WhatsApp test] verifying phone_number_id:", data.phone_number_id, "endpoint:", url.pathname)

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: "no-store",
    })
    const result = await response.json()

    console.log("[WhatsApp test] Meta response status:", response.status)

    if (!response.ok) {
      const err = result?.error || {}
      console.error("[WhatsApp test] Meta error response:", {
        status: response.status,
        code: err.code,
        subcode: err.error_subcode,
        type: err.type,
        message: err.message,
        fbtrace_id: err.fbtrace_id,
      })

      if (err.error_subcode === 33 || /missing permissions|Unsupported get request/i.test(err.message || "")) {
        throw new Error(
          `Permission missing: The stored token does not have permission to access WhatsApp Phone Number (${data.phone_number_id}). Please click Reconnect to re-authorize with WhatsApp permissions.`
        )
      }

      throw new Error(err.message || "Meta rejected the connection test")
    }

    // Update display fields in database (only existing columns)
    if (result.display_phone_number || result.verified_name) {
      await supabaseAdmin
        .from("school_whatsapp")
        .update({
          phone_number: result.display_phone_number ?? null,
          display_name: result.verified_name ?? null,
        })
        .eq("id", data.id)
    }

    return NextResponse.json({
      success: true,
      phoneNumber: result.display_phone_number ?? data.phone_number_id,
      displayName: result.verified_name ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The connected WhatsApp number could not be verified."
    console.error("[WhatsApp test] failed:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
