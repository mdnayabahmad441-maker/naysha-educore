import { NextResponse } from "next/server"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const WA_SERVER = process.env.WHATSAPP_SERVER_URL || "http://localhost:3001"

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const auth = await requireAdminProfile(req)
    if ("response" in auth) return auth.response
  }

  try {
    const res = await fetch(`${WA_SERVER}/status`, { headers: { "ngrok-skip-browser-warning": "true" } })
    const data = await res.json()
    return NextResponse.json({ success: true, provider: "whatsapp-web.js", connected: data.ready })
  } catch {
    return NextResponse.json({ success: false, provider: "whatsapp-web.js", connected: false, error: "WhatsApp server not running" })
  }
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

    const res = await fetch(`${WA_SERVER}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },
      body: JSON.stringify({ phone, message }),
    })

    const result = await res.json()

    if (!res.ok || !result.success) {
      return NextResponse.json({ success: false, error: result.error || "Send failed" }, { status: res.status })
    }

    return NextResponse.json({ success: true, provider: "whatsapp-web.js", to: result.to })
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Internal error"
    console.error("[send-whatsapp] Error:", errMsg)
    return NextResponse.json({ success: false, error: errMsg }, { status: 500 })
  }
}
