import { NextResponse } from "next/server"
import { isInternalRequest, requireAuthorizedProfile } from "@/lib/api-auth"
import { getWhatsAppCloudStatus, sendWhatsAppCloudMessage, sendWhatsAppTemplateMessage } from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
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
      const auth = await requireAuthorizedProfile(req, ["admin", "teacher"])
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

    // If caller provides explicit variables, send them directly to the template
    // (avoids param-count mismatch when template has fewer/more than 4 params)
    const variables = Array.isArray(body?.variables)
      ? (body.variables as string[]).map(String)
      : null

    const templateName = String(
      body?.templateName || process.env.WHATSAPP_TEMPLATE_NAME || "school_notice"
    ).trim()

    const result = variables
      ? await sendWhatsAppTemplateMessage({ phone, templateName, variables })
      : await sendWhatsAppCloudMessage({ phone, message })

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
