import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus } from "@/lib/whatsapp-cloud"

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const schoolId = auth.profile.schoolId ?? undefined
  const status = await getWhatsAppCloudStatus(schoolId)

  if (!status.configured) {
    return NextResponse.json({
      connected: false,
      source: status.source,
      missing: status.missing,
    })
  }

  return NextResponse.json({
    connected: true,
    source: status.source,            // "school" | "central"
    provider: status.provider,
    apiVersion: status.apiVersion,
    phoneNumber: status.phoneNumber,
    displayName: status.displayName,
    businessAccountId: status.businessAccountId,
    connectedAt: status.connectedAt,
    lastWebhookAt: status.lastWebhookAt,
    lastWebhookStatus: status.lastWebhookStatus,
    // centralized flag kept for backward compat
    centralized: status.source === "central",
  })
}
