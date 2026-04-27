import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireAdminProfile } from "@/lib/api-auth"

const API_VERSION = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0"

function getApexDomain(hostname: string): string {
  const parts = hostname.split(".")
  // localhost or IP → no apex domain sharing needed
  if (parts.length <= 1 || hostname === "localhost") return ""
  return "." + parts.slice(-2).join(".")
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminProfile(request)
  if ("response" in auth) return auth.response

  const { schoolId } = auth.profile
  if (!schoolId) {
    return NextResponse.json({ error: "No school linked to your account." }, { status: 400 })
  }

  const META_APP_ID = process.env.META_APP_ID

  // REDIRECT_URI must be fixed and match exactly what is registered in Meta App.
  // It must point to the main app domain (e.g. erp.naysha.online), NOT the school subdomain.
  const REDIRECT_URI = process.env.META_WHATSAPP_REDIRECT_URI

  if (!META_APP_ID || !REDIRECT_URI) {
    return NextResponse.json(
      {
        error: !META_APP_ID
          ? "META_APP_ID is not set in environment variables."
          : "META_WHATSAPP_REDIRECT_URI is not set. Set it to https://erp.naysha.online/api/whatsapp/callback in Vercel.",
      },
      { status: 503 }
    )
  }

  const nonce = crypto.randomUUID()
  const state = `${schoolId}::${nonce}`

  // Store the school subdomain's origin so the callback can redirect back there
  const requestOrigin = new URL(request.url).origin
  const hostname = new URL(request.url).hostname
  const apexDomain = getApexDomain(hostname)

  const cookieStore = await cookies()

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    sameSite: "lax" as const,
    path: "/",
    // Share across subdomains so the callback on the main domain can read it
    ...(apexDomain ? { domain: apexDomain } : {}),
  }

  cookieStore.set("wa_oauth_state", state, cookieOptions)
  // Remember which school subdomain origin to redirect back to after OAuth
  cookieStore.set("wa_return_origin", requestOrigin, cookieOptions)

  const oauthUrl = new URL(`https://www.facebook.com/${API_VERSION}/dialog/oauth`)
  oauthUrl.searchParams.set("client_id", META_APP_ID)
  oauthUrl.searchParams.set("redirect_uri", REDIRECT_URI)
  oauthUrl.searchParams.set("scope", "whatsapp_business_management,whatsapp_business_messaging")
  oauthUrl.searchParams.set("state", state)
  oauthUrl.searchParams.set("response_type", "code")

  return NextResponse.json({ url: oauthUrl.toString() })
}
