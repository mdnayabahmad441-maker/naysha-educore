import { NextResponse } from "next/server"

const pkg = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

const { Client, LocalAuth } = pkg

let client: any
let isReady = false

if (!client) {
  client = new Client({
    authStrategy: new LocalAuth()
  })

  client.on("qr", (qr: string) => {
    console.log("📱 Scan this QR below:")
    qrcode.generate(qr, { small: true })
  })

  client.on("ready", () => {
    console.log("✅ WhatsApp is READY")
    isReady = true
  })

  client.initialize()
}

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json()

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Missing phone or message" },
        { status: 400 }
      )
    }

    if (!isReady) {
      return NextResponse.json(
        { error: "WhatsApp not ready yet" },
        { status: 500 }
      )
    }

    const formatted = phone.includes("@c.us")
      ? phone
      : `91${phone}@c.us`

    const result = await client.sendMessage(formatted, message)

    return NextResponse.json({
      success: true,
      id: result.id._serialized
    })

  } catch (err: any) {
    console.error("WhatsApp Error:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}