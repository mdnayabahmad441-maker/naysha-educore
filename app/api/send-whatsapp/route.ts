import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus, sendWhatsAppTemplateMessage } from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const authResult = await requireAdminProfile(req)
    if ("response" in authResult) return authResult.response
  }

  const status = await getWhatsAppCloudStatus()

  return NextResponse.json({
    success: true,
    provider: "whatsapp-cloud-api",
    configured: status.configured,
    missing: status.missing,
    apiVersion: status.apiVersion,
  })
}

export async function POST(req: Request) {
  try {
    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) return authResult.response
    }

    const body = await req.json()
    const phone = String(body?.phone || body?.to || "").trim()
    const message = String(body?.message || "").trim()
    const schoolName = String(body?.schoolName || "School").trim()
    const parentName = String(body?.parentName || "Parent").trim()

    if (!phone || !message) {
      return NextResponse.json({ error: "Missing phone/to or message" }, { status: 400 })
    }

    const status = await getWhatsAppCloudStatus()
    if (!status.configured) {
      return NextResponse.json(
        { error: `WhatsApp is not configured. Missing: ${status.missing.join(", ")}` },
        { status: 503 }
      )
    }

    const result = await sendWhatsAppTemplateMessage({ phone, message, schoolName, parentName })

    return NextResponse.json({
      success: true,
      provider: "whatsapp-cloud-api",
      to: result.to,
      messageId: result.messageId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
