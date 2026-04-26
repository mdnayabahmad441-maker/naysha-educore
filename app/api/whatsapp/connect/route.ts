import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function normalizeWhatsAppSender(value: string) {
  const trimmed = String(value || "").trim()
  if (!trimmed) return ""

  const withoutPrefix = trimmed.replace(/^whatsapp:/i, "").replace(/\s+/g, "")
  const withPlus = withoutPrefix.startsWith("+") ? withoutPrefix : `+${withoutPrefix.replace(/\D/g, "")}`

  return `whatsapp:${withPlus}`
}

export async function GET() {
  return NextResponse.json(
    {
      error: "Use POST to save this school's Twilio WhatsApp configuration.",
    },
    { status: 405 }
  )
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ error: "No school linked to your account." }, { status: 400 })
  }

  try {
    const body = await request.json()
    const accountSid = String(body?.accountSid || "").trim()
    const authToken = String(body?.authToken || "").trim()
    const fromNumber = normalizeWhatsAppSender(String(body?.fromNumber || ""))
    const displayName = String(body?.displayName || "").trim() || null

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json(
        { error: "Account SID, Auth Token, and WhatsApp sender are required." },
        { status: 400 }
      )
    }

    if (!/^AC[a-zA-Z0-9]{32}$/.test(accountSid)) {
      return NextResponse.json(
        { error: "Invalid Twilio Account SID." },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from("school_whatsapp")
      .upsert(
        {
          school_id: schoolId,
          provider: "twilio_whatsapp",
          account_sid: accountSid,
          auth_token: authToken,
          from_number: fromNumber,
          display_name: displayName,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "school_id" }
      )

    if (error) {
      console.error("[WhatsApp connect] DB error:", error.message)
      return NextResponse.json({ error: "Failed to save Twilio WhatsApp configuration." }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      provider: "twilio_whatsapp",
      fromNumber,
      displayName,
    })
  } catch (error) {
    console.error("[WhatsApp connect] error:", error)
    return NextResponse.json({ error: "Failed to save configuration." }, { status: 500 })
  }
}
