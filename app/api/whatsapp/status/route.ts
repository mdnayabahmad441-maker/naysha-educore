import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function maskSid(accountSid: string | null) {
  if (!accountSid) return null
  if (accountSid.length <= 8) return accountSid
  return `${accountSid.slice(0, 4)}...${accountSid.slice(-4)}`
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ connected: false })
  }

  const { data, error } = await supabaseAdmin
    .from("school_whatsapp")
    .select("provider, account_sid, auth_token, from_number, display_name, connected_at, updated_at")
    .eq("school_id", schoolId)
    .maybeSingle()

  if (error) {
    console.error("[WhatsApp status] DB error:", error.message)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }

  if (!data?.account_sid || !data?.auth_token || !data?.from_number) {
    return NextResponse.json({ connected: false })
  }

  return NextResponse.json({
    connected: true,
    provider: data.provider || "twilio_whatsapp",
    accountSid: maskSid(data.account_sid),
    fromNumber: data.from_number,
    displayName: data.display_name,
    connectedAt: data.connected_at,
    updatedAt: data.updated_at,
  })
}
