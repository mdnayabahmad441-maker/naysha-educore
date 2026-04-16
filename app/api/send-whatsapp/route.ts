import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // ✅ Accept both formats (phone OR to)
    let phone: string = body.phone || body.to
    const message: string = body.message

    // ✅ Validation
    if (!phone) {
      return NextResponse.json(
        { error: "Missing phone" },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      )
    }

    // ✅ Format phone (auto add +91 if missing)
    phone = phone.trim()

    if (!phone.startsWith("+")) {
      phone = `+91${phone}`
    }

    // ✅ Init Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    console.log("📲 Sending WhatsApp to:", phone)

    // ✅ Send message
    const msg = await client.messages.create({
      body: message,
      from: "whatsapp:+14155238886", // Twilio sandbox number
      to: `whatsapp:${phone}`,
    })

    console.log("✅ Message sent:", msg.sid)

    return NextResponse.json({
      success: true,
      sid: msg.sid,
    })

  } catch (err: any) {
    console.error("❌ WhatsApp Error:", err)

    return NextResponse.json(
      {
        error: err.message || "Something went wrong",
      },
      { status: 500 }
    )
  }
}