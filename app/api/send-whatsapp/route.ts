import { NextResponse } from "next/server"

// ⚠️ use require (important for these libs)
const pkg = require("whatsapp-web.js")
const qrcode = require("qrcode-terminal")

const { Client, LocalAuth } = pkg

let client: any
let isReady = false

// 🚀 INIT CLIENT ONLY ONCE
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

  client.on("auth_failure", (msg: string) => {
    console.error("❌ Auth failed:", msg)
  })

  client.on("disconnected", () => {
    console.log("⚠️ WhatsApp disconnected")
    isReady = false
  })

  client.initialize()
}

//////////////////////////////////////////////////
// ✅ GET (for testing only)
//////////////////////////////////////////////////
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "WhatsApp API running. Check terminal for status."
  })
}

//////////////////////////////////////////////////
// ✅ POST (MAIN SEND FUNCTION)
//////////////////////////////////////////////////
export async function POST(req: Request) {
  try {
    const body = await req.json()

    const phone = body?.phone
    const message = body?.message

    // 🔍 DEBUG LOG (important)
    console.log("Incoming:", phone, message)

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

    // ✅ CLEAN FORMAT
    let formatted = phone.toString().trim()

    // remove + if exists
    if (formatted.startsWith("+")) {
      formatted = formatted.slice(1)
    }

    // add country code if missing
    if (!formatted.startsWith("91")) {
      formatted = "91" + formatted
    }

    // final format
    formatted = formatted + "@c.us"

    console.log("Sending to:", formatted)

    const result = await client.sendMessage(formatted, message)

    return NextResponse.json({
      success: true,
      id: result.id._serialized
    })

  } catch (err: any) {
    console.error("❌ WhatsApp Error:", err)

    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    )
  }
}