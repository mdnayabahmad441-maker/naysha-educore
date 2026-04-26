import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
  const redirectUrl = new URL("/admin/settings", origin)
  redirectUrl.searchParams.set("whatsapp", "manual")
  redirectUrl.searchParams.set("message", "Meta callback is no longer used. Save Twilio WhatsApp details manually in Settings.")

  return NextResponse.redirect(redirectUrl)
}
