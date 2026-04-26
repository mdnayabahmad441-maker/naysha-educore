import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ error: "No school linked to your account." }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from("school_whatsapp")
    .delete()
    .eq("school_id", schoolId)

  if (error) {
    console.error("[WhatsApp disconnect] DB error:", error.message)
    return NextResponse.json({ error: "Failed to disconnect WhatsApp." }, { status: 500 })
  }

  console.info("[WhatsApp disconnect] Disconnected school", schoolId)
  return NextResponse.json({ success: true })
}
