import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response
  if (!auth.profile.schoolId) return NextResponse.json({ error: "No school is linked to this account." }, { status: 400 })
  const { data } = await supabaseAdmin.from("school_whatsapp").select("access_token, phone_number_id").eq("school_id", auth.profile.schoolId).maybeSingle()
  if (!data?.access_token || !data.phone_number_id) return NextResponse.json({ error: "No WhatsApp number is connected for this school." }, { status: 404 })
  try {
    const url = new URL(`https://graph.facebook.com/${API_VERSION}/${data.phone_number_id}`); url.searchParams.set("fields", "id,display_phone_number,verified_name,status")
    const response = await fetch(url, { headers: { Authorization: `Bearer ${data.access_token}` }, cache: "no-store" }); const result = await response.json()
    if (!response.ok) throw new Error(result?.error?.message || "Meta rejected the connection")
    await supabaseAdmin.from("school_whatsapp").update({ status: "connected", updated_at: new Date().toISOString() }).eq("school_id", auth.profile.schoolId)
    return NextResponse.json({ success: true, phoneNumber: result.display_phone_number ?? null })
  } catch (error) {
    console.error("[WhatsApp test]", error)
    await supabaseAdmin.from("school_whatsapp").update({ status: "error", updated_at: new Date().toISOString() }).eq("school_id", auth.profile.schoolId)
    return NextResponse.json({ error: "The connected WhatsApp number could not be verified. Reconnect it and try again." }, { status: 400 })
  }
}
