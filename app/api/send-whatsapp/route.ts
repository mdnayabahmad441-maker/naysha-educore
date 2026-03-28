import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {

  try{

    const body = await req.json()

    const { to, studentName, pdfUrl } = body

    if(!to || !studentName || !pdfUrl){
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      )
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    const message = `📄 Report Card Available

Hello,

Your child *${studentName}*'s report card is ready.

👉 Download here:
${pdfUrl}

- NaySha School`

    const msg = await client.messages.create({
      body: message,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${to}`
    })

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