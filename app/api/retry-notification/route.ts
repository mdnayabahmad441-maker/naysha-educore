import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { getBaseUrl, getInternalApiHeaders } from "@/lib/internal-api"
import { requireAdminProfile } from "@/lib/api-auth"

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  const { logId } = await req.json()

  const { data: log } = await supabaseAdmin
    .from("notifications_log")
    .select("*")
    .eq("id", logId)
    .single()

  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 })
  }

  if (authResult.profile.schoolId !== log.school_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const baseUrl = getBaseUrl(req)

  await fetch(`${baseUrl}/api/notify`, {
    method: "POST",
    headers: getInternalApiHeaders(),
    body: JSON.stringify({
      type: "payment",
      refId: log.ref_id,
    }),
  })

  return NextResponse.json({ success: true })
}
