import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ connected: false })
  }

  const { data, error } = await supabaseAdmin
    .from("school_whatsapp")
    .select("phone_number, display_name, business_account_id, phone_number_id, last_webhook_event_at, last_webhook_status, connected_at, updated_at")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (error) {
    console.error("[WhatsApp status] DB error:", error.message)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }

  if (!data?.phone_number_id) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    provider: "whatsapp-cloud-api",
    phoneNumber: data.phone_number,
    displayName: data.display_name,
    businessAccountId: data.business_account_id,
    phoneNumberId: data.phone_number_id,
    lastWebhookEventAt: data.last_webhook_event_at,
    lastWebhookStatus: data.last_webhook_status,
    connectedAt: data.connected_at,
    updatedAt: data.updated_at,
  })
}
