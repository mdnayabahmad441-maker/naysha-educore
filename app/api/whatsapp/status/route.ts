import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus } from "@/lib/whatsapp-cloud"

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const status = await getWhatsAppCloudStatus()

  if (!status.configured) {
    return NextResponse.json({ connected: false, missing: status.missing })
  }

  return NextResponse.json({
    connected: true,
    provider: "whatsapp-cloud-api",
    centralized: true,
    apiVersion: status.apiVersion,
  })
}
