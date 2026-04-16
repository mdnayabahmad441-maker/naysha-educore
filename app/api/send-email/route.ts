import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { email, subject, message, studentName, amount, feeType } = body

    if (!email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing email or message" },
        { status: 400 }
      )
    }

    // 🎨 Clean ERP-style email template
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        
        <h2 style="color:#185FA5;margin-bottom:10px">
          NaySha School ERP
        </h2>

        <p>Dear Parent,</p>

        <p>${message}</p>

        ${
          amount
            ? `<p><strong>Amount:</strong> ₹${amount}</p>`
            : ""
        }

        ${
          feeType
            ? `<p><strong>Fee Type:</strong> ${feeType}</p>`
            : ""
        }

        ${
          studentName
            ? `<p><strong>Student:</strong> ${studentName}</p>`
            : ""
        }

        <br/>

        <p style="font-size:13px;color:#475569">
          This is an automated message from NaySha ERP.
        </p>

        <hr style="margin-top:20px"/>

        <p style="font-size:12px;color:#94a3b8">
          © ${new Date().getFullYear()} NaySha Technologies
        </p>

      </div>
    `

    const data = await resend.emails.send({
      from: "NaySha ERP <onboarding@resend.dev>", // change after domain setup
      to: [email], // ALWAYS array
      subject: subject || "School Notification",
      html: htmlContent,
    })

    return NextResponse.json({
      success: true,
      data,
    })

  } catch (err: any) {
    console.error("Email Error:", err)

    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}