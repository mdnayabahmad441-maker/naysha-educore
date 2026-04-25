import { NextResponse } from "next/server"
import { Resend } from "resend"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"

function getEmailStatus() {
  const apiKey = process.env.RESEND_API_KEY || null
  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
  const missing: string[] = []

  if (!apiKey) {
    missing.push("RESEND_API_KEY")
  }

  return {
    configured: missing.length === 0,
    missing,
    fromEmail,
  }
}

function buildHtmlContent({
  message,
  amount,
  feeType,
  studentName,
}: {
  message: string
  amount?: string | number
  feeType?: string
  studentName?: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <h2 style="color:#185FA5;margin-bottom:10px">
        NaySha School ERP
      </h2>

      <p>Dear Parent,</p>
      <p>${message}</p>

      ${amount ? `<p><strong>Amount:</strong> Rs ${amount}</p>` : ""}
      ${feeType ? `<p><strong>Fee Type:</strong> ${feeType}</p>` : ""}
      ${studentName ? `<p><strong>Student:</strong> ${studentName}</p>` : ""}

      <br/>

      <p style="font-size:13px;color:#475569">
        This is an automated message from NaySha ERP.
      </p>

      <hr style="margin-top:20px"/>

      <p style="font-size:12px;color:#94a3b8">
        &copy; ${new Date().getFullYear()} NaySha Technologies
      </p>
    </div>
  `
}

export async function GET(req: Request) {
  if (!isInternalRequest(req)) {
    const authResult = await requireAdminProfile(req)
    if ("response" in authResult) {
      return authResult.response
    }
  }

  const status = getEmailStatus()

  return NextResponse.json({
    success: true,
    provider: "resend",
    configured: status.configured,
    missing: status.missing,
    fromEmail: status.fromEmail,
  })
}

export async function POST(req: Request) {
  try {
    if (!isInternalRequest(req)) {
      const authResult = await requireAdminProfile(req)
      if ("response" in authResult) {
        return authResult.response
      }
    }

    const status = getEmailStatus()

    if (!status.configured) {
      return NextResponse.json(
        {
          success: false,
          error: "Email service is not configured on the server",
          missing: status.missing,
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const email = String(body.email || body.to || "").trim().toLowerCase()
    const subject = String(body.subject || "School Notification").trim()
    const message = String(body.message || "").trim()
    const studentName = body.studentName
    const amount = body.amount
    const feeType = body.feeType

    if (!email || !message) {
      return NextResponse.json(
        { success: false, error: "Missing email or message" },
        { status: 400 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const data = await resend.emails.send({
      from: `NaySha ERP <${status.fromEmail}>`,
      to: [email],
      subject,
      html: buildHtmlContent({
        message,
        amount,
        feeType,
        studentName,
      }),
    })

    return NextResponse.json({
      success: true,
      provider: "resend",
      to: email,
      from: status.fromEmail,
      data,
    })
  } catch (err: any) {
    console.error("Email Error:", err)

    return NextResponse.json(
      { success: false, error: err.message || "Internal error" },
      { status: 500 }
    )
  }
}
