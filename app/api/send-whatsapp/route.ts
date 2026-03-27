import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {

  try{

    const body = await req.json()

    // ✅ FIXED FIELD NAME
    const { to, message } = body

    if(!to || !message){
      return NextResponse.json(
        { error: "Missing 'to' or 'message'" },
        { status: 400 }
      )
    }

    // ✅ INIT CLIENT INSIDE FUNCTION (SAFE)
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    console.log("📤 Sending WhatsApp to:", to)

    const msg = await client.messages.create({
      body: message,

      // ✅ FORCE SAFE DEFAULT (no env mistake)
      from: "whatsapp:+14155238886",

      to: `whatsapp:${to}`
    })

    console.log("✅ Sent:", msg.sid)

    return NextResponse.json({
      success: true,
      sid: msg.sid
    })

  }catch(err:any){

    console.error("❌ WhatsApp Error:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }

}