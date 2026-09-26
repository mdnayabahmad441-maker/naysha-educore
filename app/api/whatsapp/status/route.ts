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
      fallbackActive: status.source === "central",
      source: status.source,
      connectionStatus: status.connectionStatus,
      missing: status.missing,
      phoneNumberId: status.phoneNumberId ?? null,
      businessAccountId: status.businessAccountId ?? null,
    })
  }

  return NextResponse.json({
    connected: status.source === "school",
    fallbackActive: status.source === "central",
    source: status.source,            // "school" | "central"
    connectionStatus: status.connectionStatus,
    provider: status.provider,
    apiVersion: status.apiVersion,
    phoneNumber: status.phoneNumber,
    displayName: status.displayName,
    businessAccountId: status.businessAccountId,
    connectedAt: status.connectedAt,
    lastWebhookAt: status.lastWebhookAt,
    lastWebhookStatus: status.lastWebhookStatus,
    centralized: status.source === "central",
  })
}
