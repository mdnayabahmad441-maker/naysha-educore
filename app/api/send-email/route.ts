import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request){

  try{

    const body = await req.json()
    const { to, subject, message } = body

    const data = await resend.emails.send({
      from: "NaySha <onboarding@resend.dev>",
      to,
      subject,
      html: `<p>${message}</p>`
    })

    return Response.json({ success: true, data })

  }catch(err){
    return Response.json({ success: false, error: err })
  }

}