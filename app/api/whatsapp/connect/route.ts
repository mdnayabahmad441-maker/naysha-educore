import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireAdminProfile } from "@/lib/api-auth"

const META_APP_ID = process.env.META_APP_ID
const REDIRECT_URI = process.env.META_WHATSAPP_REDIRECT_URI
const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ error: "No school linked to your account." }, { status: 400 })
  }

  if (!META_APP_ID || !REDIRECT_URI) {
    return NextResponse.json(
      {
        error:
          "WhatsApp integration is not configured on this server. Add META_APP_ID and META_WHATSAPP_REDIRECT_URI to your environment variables.",
      },
      { status: 503 }
    )
  }

  const nonce = crypto.randomUUID()
  const state = `${schoolId}::${nonce}`

  const cookieStore = await cookies()
  cookieStore.set("wa_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax",
    path: "/",
  })

  const oauthUrl = new URL(`https://www.facebook.com/${API_VERSION}/dialog/oauth`)
  oauthUrl.searchParams.set("client_id", META_APP_ID)
  oauthUrl.searchParams.set("redirect_uri", REDIRECT_URI)
  oauthUrl.searchParams.set("scope", "whatsapp_business_management,whatsapp_business_messaging,business_management")
  oauthUrl.searchParams.set("state", state)
  oauthUrl.searchParams.set("response_type", "code")

  return NextResponse.json({ url: oauthUrl.toString() })
}
