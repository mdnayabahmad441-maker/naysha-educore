import { NextResponse } from "next/server"
import twilio from "twilio"

export async function POST(req: Request) {

  try{

    const body = await req.json()

    const { to, message, studentName, pdfUrl } = body

    // ==========================
    // ✅ VALIDATION (FLEXIBLE)
    // ==========================
    if(!to){
      return NextResponse.json(
        { error: "Missing 'to'" },
        { status: 400 }
      )
    }

    // ==========================
    // ✅ INIT TWILIO
    // ==========================
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )

    let finalMessage = ""

    // ==========================
    // 📄 REPORT CARD MESSAGE
    // ==========================
    if(studentName && pdfUrl){
      finalMessage = `📄 Report Card Available

Hello,

Your child *${studentName}*'s report card is ready.

👉 Download here:
${pdfUrl}

- NaySha School`
    }

    // ==========================
    // 📢 SIMPLE MESSAGE (ATTENDANCE ETC)
    // ==========================
    else if(message){
      finalMessage = message
    }

    else{
      return NextResponse.json(
        { error: "Provide either (studentName + pdfUrl) OR message" },
        { status: 400 }
      )
    }

    console.log("📤 Sending WhatsApp:", to)

    const msg = await client.messages.create({
      body: finalMessage,
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