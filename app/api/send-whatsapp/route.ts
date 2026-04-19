import { NextResponse } from "next/server"
import qrcode from "qrcode-terminal"
import { Client, LocalAuth } from "whatsapp-web.js"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WhatsAppClient = InstanceType<typeof Client>

let client: WhatsAppClient | null = null
let isReady = false

function getClient() {
  if (client) return client

  client = new Client({
    authStrategy: new LocalAuth()
  })

  client.on("qr", (qr: string) => {
    console.log("Scan this WhatsApp QR:")
    qrcode.generate(qr, { small: true })
  })

  client.on("ready", () => {
    console.log("WhatsApp is ready")
    isReady = true
  })

  client.on("auth_failure", (msg: string) => {
    console.error("WhatsApp auth failed:", msg)
    isReady = false
  })

  client.on("disconnected", () => {
    console.log("WhatsApp disconnected")
    isReady = false
  })

  void client.initialize()
  return client
}

export async function GET() {
  getClient()

  return NextResponse.json({
    success: true,
    ready: isReady,
    message: "WhatsApp API running. Check the terminal for QR/status."
  })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const phone = body?.phone || body?.to
    const message = body?.message

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing phone/to or message" },
        { status: 400 }
      )
    }

    const activeClient = getClient()

    if (!isReady) {
      return NextResponse.json(
        { error: "WhatsApp not ready yet" },
        { status: 503 }
      )
    }

    let formatted = String(phone).trim().replace(/\D/g, "")

    if (formatted.startsWith("0")) {
      formatted = formatted.slice(1)
    }

    if (formatted.length === 10) {
      formatted = `91${formatted}`
    }

    if (!formatted.startsWith("91")) {
      formatted = `91${formatted}`
    }

    const result = await activeClient.sendMessage(`${formatted}@c.us`, message)

    return NextResponse.json({
      success: true,
      id: result.id._serialized
    })
  } catch (err) {
    console.error("WhatsApp error:", err)

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    )
  }
}
