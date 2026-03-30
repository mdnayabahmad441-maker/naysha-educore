import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {

  try{

    const body = await req.json()

    const { phone, message, studentName, pdfUrl } = body // ✅ FIXED (phone instead of to)

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

    let finalMessage = ""

    // 📄 REPORT CARD
    if(studentName && pdfUrl){
      finalMessage = `📄 Report Card Available

Hello,

Your child *${studentName}*'s report card is ready.

👉 Download here:
${pdfUrl}

- NaySha School`
    }

    // 📢 NORMAL MESSAGE (ATTENDANCE)
    else if(message){
      finalMessage = message
    }

    else{
      return NextResponse.json(
        { error: "Provide message or report data" },
        { status: 400 }
      )
    }

    const msg = await client.messages.create({
      body: finalMessage,
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}` // ✅ FIXED
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