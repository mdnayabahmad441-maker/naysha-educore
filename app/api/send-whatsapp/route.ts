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

  const url = new URL(req.url)
  const schoolId = url.searchParams.get("schoolId") ?? undefined

  const status = await getWhatsAppCloudStatus(schoolId)
  return NextResponse.json({
    success: true,
    provider: "whatsapp-cloud-api",
    configured: status.configured,
    source: status.source,
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
    const phone      = String(body?.phone || body?.to || "").trim()
    const message    = String(body?.message || "").trim()
    const schoolId   = body?.schoolId ? String(body.schoolId) : undefined

    if (!phone || !message) {
      return NextResponse.json({ error: "Missing phone or message" }, { status: 400 })
    }

    const status = await getWhatsAppCloudStatus(schoolId)
    if (!status.configured) {
      return NextResponse.json(
        {
          error: schoolId
            ? "WhatsApp not connected for this school. Go to Settings → WhatsApp to connect your own number."
            : `WhatsApp not configured. Missing: ${status.missing.join(", ")}`,
        },
        { status: 503 }
      )
    }

    const variables    = Array.isArray(body?.variables) ? (body.variables as string[]).map(String) : null
    const templateName = String(body?.templateName || process.env.WHATSAPP_TEMPLATE_NAME || "school_notice").trim()

    const result = variables
      ? await sendWhatsAppTemplateMessage({ phone, templateName, variables, schoolId })
      : await sendWhatsAppCloudMessage({ phone, message, schoolId })

    return NextResponse.json({ success: true, provider: "whatsapp-cloud-api", to: result.to, source: "source" in result ? result.source : undefined })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", errMsg)

    const isApiError =
      errMsg.includes("(#") ||
      errMsg.includes("template") ||
      errMsg.includes("Meta WhatsApp") ||
      errMsg.includes("OAuthException")

    return NextResponse.json({ success: false, error: errMsg }, { status: isApiError ? 200 : 500 })
  }
}
