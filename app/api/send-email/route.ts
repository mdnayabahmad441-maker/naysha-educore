import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request){

  try{

    const body = await req.json()

    const { email, subject, message } = body // ✅ FIXED (email instead of to)

    if(!email || !message){
      return Response.json({
        success:false,
        error:"Missing email or message"
      },{ status:400 })
    }

    const data = await resend.emails.send({
      from: "NaySha <onboarding@resend.dev>",
      to: email, // ✅ FIXED
      subject: subject || "Notification",
      html: `<p>${message}</p>`
    })

    return Response.json({ success: true, data })

  }catch(err:any){
    console.error("Email Error:", err)

    return Response.json({
      success:false,
      error: err.message
    },{ status:500 })
  }

}