import { NextRequest, NextResponse } from "next/server"
import { requireAdminProfile } from "@/lib/api-auth"

const STATE_COOKIE = "wa_embedded_signup"

export async function POST(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const schoolId = auth.profile.schoolId
  const appId = process.env.META_APP_ID
  const configId = process.env.META_WHATSAPP_CONFIG_ID
  if (!schoolId) return NextResponse.json({ error: "No school is linked to this account." }, { status: 400 })
  if (!appId || !configId) return NextResponse.json({ error: "WhatsApp onboarding is not configured. Contact NaySha EduCore support." }, { status: 503 })

  const response = NextResponse.json({ appId, configId })
  response.cookies.set(STATE_COOKIE, JSON.stringify({ schoolId, nonce: crypto.randomUUID() }), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/api/whatsapp",
  })
  return response
}
