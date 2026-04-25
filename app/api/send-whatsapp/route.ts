import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import {
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

  return NextResponse.json({
    success: true,
    provider: "whatsapp-cloud-api",
    configured: isWhatsAppCloudConfigured(),
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || null,
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
