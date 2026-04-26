import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"
import {
  getWhatsAppCloudStatus,
  sendWhatsAppCloudMessage,
} from "@/lib/whatsapp-cloud"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function normalizeSchoolId(value: unknown) {
  const schoolId = String(value || "").trim()
  return schoolId || null
}

export async function GET(req: Request) {
  let schoolId: string | null = null

  if (!isInternalRequest(req)) {
    const authResult = await requireAdminProfile(req)
    if ("response" in authResult) {
      return authResult.response
    }

    schoolId = authResult.profile.schoolId
  } else {
    const url = new URL(req.url)
    schoolId = normalizeSchoolId(url.searchParams.get("schoolId"))
  }

  if (!schoolId) {
    return NextResponse.json(
      { error: "School ID is required" },
      { status: 400 }
    )
  }

  const status = await getWhatsAppCloudStatus(schoolId)

  return NextResponse.json({
    success: true,
    provider: "twilio_whatsapp",
    configured: status.configured,
    missing: status.missing,
    fromNumber: status.fromNumber,
    displayName: status.displayName,
  })
}

export async function POST(req: Request) {
  try {
    let schoolId: string | null = null

    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) {
        return authResult.response
      }

      schoolId = authResult.profile.schoolId
    }

    const body = await req.json()
    const phone = String(body?.phone || body?.to || "").trim()
    const message = String(body?.message || "").trim()

    schoolId = schoolId || normalizeSchoolId(body?.schoolId)

    if (!schoolId) {
      return NextResponse.json(
        { error: "Missing schoolId for internal WhatsApp request" },
        { status: 400 }
      )
    }

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing phone/to or message" },
        { status: 400 }
      )
    }

    const status = await getWhatsAppCloudStatus(schoolId)

    if (!status.configured) {
      return NextResponse.json(
        {
          error: "Twilio WhatsApp is not configured for this school",
          missing: status.missing,
        },
        { status: 503 }
      )
    }

    const result = await sendWhatsAppCloudMessage({
      schoolId,
      phone,
      message,
    })

    return NextResponse.json({
      success: true,
      provider: "twilio_whatsapp",
      to: result.to,
      result: result.data,
    })
  } catch (err) {
    console.error("Twilio WhatsApp error:", err)

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
