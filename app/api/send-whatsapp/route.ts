import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import {
  getWhatsAppCloudStatus,
  isWhatsAppCloudConfigured,
  sendWhatsAppCloudMessage,
} from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const authResult = await requireAdminProfile(req)
    if ("response" in authResult) {
      return authResult.response
    }
  }

  const status = getWhatsAppCloudStatus()

  return NextResponse.json({
    success: true,
    provider: "whatsapp-cloud-api",
    configured: isWhatsAppCloudConfigured(),
    missing: status.missing,
    phoneNumberId: status.phoneNumberId,
    businessAccountId: status.businessAccountId,
    apiVersion: status.apiVersion,
  })
}

export async function POST(req: Request) {
  try {
    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) {
        return authResult.response
      }
    }

    const body = await req.json()
    const phone = String(body?.phone || body?.to || "").trim()
    const message = String(body?.message || "").trim()

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing phone/to or message" },
        { status: 400 }
      )
    }

    const status = getWhatsAppCloudStatus()

    if (!status.configured) {
      return NextResponse.json(
        {
          error: "WhatsApp Cloud API is not configured on the server",
          missing: status.missing,
        },
        { status: 503 }
      )
    }

    const result = await sendWhatsAppCloudMessage({
      phone,
      message,
    })

    return NextResponse.json({
      success: true,
      provider: "whatsapp-cloud-api",
      to: result.to,
      result: result.data,
    })
  } catch (err) {
    console.error("WhatsApp Cloud API error:", err)

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
