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
    const errMsg = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", errMsg)

    // Meta API errors (e.g. #133010 invalid number, #131056 rate limit) are not server bugs.
    // Return 200 with success:false so callers can handle gracefully without browser 500 noise.
    const isMetaError = errMsg.includes("(#")
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: isMetaError ? 200 : 500 }
    )
  }
}
