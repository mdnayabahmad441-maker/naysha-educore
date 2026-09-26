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
    // Query phone number details without restricted fields (avoiding 'status' which requires Advanced Access)
    const url = new URL(`https://graph.facebook.com/${API_VERSION}/${data.phone_number_id}`)
    url.searchParams.set("fields", "id,display_phone_number,verified_name")

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${data.access_token}` },
      cache: "no-store",
    })
    const result = await response.json()

    if (!response.ok) {
      const errMsg = result?.error?.message || "Meta rejected the connection test"
      console.error("[WhatsApp test] Meta error:", errMsg)
      throw new Error(errMsg)
    }

    // Update display fields if found (only existing columns in DB)
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
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "The connected WhatsApp number could not be verified."
    console.error("[WhatsApp test] failure:", message)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
