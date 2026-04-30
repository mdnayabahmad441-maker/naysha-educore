import { NextResponse } from "next/server"
import { Resend } from "resend"
import nodemailer from "nodemailer"
import { isInternalRequest, requireAdminProfile } from "@/lib/api-auth"

const RESEND_TEST_FROM = "onboarding@resend.dev"

function getEmailProvider(): "resend" | "gmail" | "none" {
  // Gmail with App Password works for any recipient — prefer it when configured
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) return "gmail"
  if (process.env.RESEND_API_KEY) return "resend"
  return "none"
}

function getEmailStatus() {
  const provider = getEmailProvider()
  const missing: string[] = []

  if (provider === "none") {
    missing.push("RESEND_API_KEY (recommended) or EMAIL_USER + EMAIL_PASS (Gmail App Password)")
  }

  return {
    configured: provider !== "none",
    missing,
    provider,
    fromEmail:
      provider === "resend"
        ? (process.env.RESEND_FROM_EMAIL ?? RESEND_TEST_FROM)
        : provider === "gmail"
        ? (process.env.EMAIL_USER ?? "")
        : "",
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
          error: "Email service is not configured. Set EMAIL_USER and EMAIL_PASS in your .env.",
          missing: status.missing,
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const email = String(body.email || body.to || "").trim().toLowerCase()
    const subject = String(body.subject || "School Notification").trim().slice(0, 200)
    const message = String(body.message || "").trim().slice(0, 5000)
    const studentName = body.studentName ? String(body.studentName).slice(0, 200) : undefined
    const amount = body.amount
    const feeType = body.feeType ? String(body.feeType).slice(0, 100) : undefined

    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Valid email address required" },
        { status: 400 }
      )
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Missing message" },
        { status: 400 }
      )
    }

    const html = buildHtmlContent({ message, amount, feeType, studentName })

    if (status.provider === "resend") {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const data = await resend.emails.send({
        from: `NaySha ERP <${status.fromEmail}>`,
        to: [email],
        subject,
        html,
      })
      return NextResponse.json({ success: true, provider: "resend", to: email, data })
    }

    // Gmail via nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `NaySha ERP <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html,
    })

    return NextResponse.json({ success: true, provider: "gmail", to: email })
  } catch (err: any) {
    console.error("Email Error:", err)
    return NextResponse.json(
      { success: false, error: err.message || "Internal error" },
      { status: 500 }
    )
  }
}
