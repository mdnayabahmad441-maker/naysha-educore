import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus, sendWhatsAppCloudMessage } from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const auth = await requireAdminProfile(req)
    if ("response" in auth) return auth.response
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
      const auth = await requireAdminProfile(req)
      if ("response" in auth) return auth.response
    }

    const body = await req.json()
    const phone = String(body?.phone || body?.to || "").trim()
    const message = String(body?.message || "").trim()

    if (!phone || !message) {
      return NextResponse.json({ error: "Missing phone or message" }, { status: 400 })
    }

    const status = await getWhatsAppCloudStatus()
    if (!status.configured) {
      return NextResponse.json(
        { error: `WhatsApp not configured. Missing: ${status.missing.join(", ")}` },
        { status: 503 }
      )
    }

    const result = await sendWhatsAppCloudMessage({ phone, message })

    return NextResponse.json({ success: true, provider: "whatsapp-cloud-api", to: result.to })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", errMsg)

    const isApiError =
      errMsg.includes("(#") ||
      errMsg.includes("template") ||
      errMsg.includes("Meta WhatsApp") ||
      errMsg.includes("OAuthException")

    return NextResponse.json(
      { success: false, error: errMsg },
      { status: isApiError ? 200 : 500 }
    )
  }
}
