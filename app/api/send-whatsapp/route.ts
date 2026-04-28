import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus, sendWhatsAppTemplateMessage } from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ✅ GET: Check WhatsApp config status
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

// ✅ POST: Send WhatsApp template message
export async function POST(req: Request) {
  try {
    // 🔐 Auth check
    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) return authResult.response
    }

    const body = await req.json()

    // ✅ REQUIRED INPUTS
    const phone = String(body?.phone || body?.to || "").trim()
    const templateName = String(body?.templateName || "").trim()
    const variables = Array.isArray(body?.variables) ? body.variables : []

    // ❌ Validation
    if (!phone || !templateName) {
      return NextResponse.json(
        { error: "Missing phone/to or templateName" },
        { status: 400 }
      )
    }

    // 📡 Check WhatsApp config
    const status = await getWhatsAppCloudStatus()
    if (!status.configured) {
      return NextResponse.json(
        {
          error: `WhatsApp is not configured. Missing: ${status.missing.join(", ")}`,
        },
        { status: 503 }
      )
    }

    // 🚀 Send template message
    const result = await sendWhatsAppTemplateMessage({
  phone,
  templateName,
  variables,
})

    return NextResponse.json({
      success: true,
      provider: "whatsapp-cloud-api",
      to: result.to,
      messageId: result.messageId,
    })

  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", errMsg)

    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    )
  }
}