import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {

  try{

    const body = await req.json()

    const { phone, message } = body

    if(!phone){
      return NextResponse.json(
        { error: "Missing phone" },
        { status: 400 }
      )
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const msg = await client.messages.create({
      body: message,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`
    })

    return NextResponse.json({
      success: true,
      sid: msg.sid
    })

  }catch(err:any){

    console.error("WhatsApp Error:", err)

    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}