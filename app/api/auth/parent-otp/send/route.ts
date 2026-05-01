import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"
import { Resend } from "resend"
import { createHash, randomInt } from "crypto"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const OTP_TTL_MS = 10 * 60 * 1000 // 10 minutes
const OTP_SECRET = process.env.OTP_SECRET || "naysha-otp-secret"

function generateCode(): string {
  return String(randomInt(100000, 999999))
}

function hashCode(code: string): string {
  return createHash("sha256").update(`${code}:${OTP_SECRET}`).digest("hex")
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`parent-otp-send:${ip}`, 3, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before requesting another code." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Verify parent exists
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  // Anti-enumeration: always return success even if not found
  if (!parent) {
    return NextResponse.json({ success: true })
  }

  // Ensure Supabase auth user exists
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (
    createError &&
    !createError.message.toLowerCase().includes("already registered") &&
    !createError.message.toLowerCase().includes("already been registered") &&
    !createError.message.toLowerCase().includes("already exists")
  ) {
    console.error("[parent-otp/send] createUser error:", createError.message)
    return NextResponse.json({ error: "Failed to initialize account" }, { status: 500 })
  }

  // Generate OTP
  const code = generateCode()
  const codeHash = hashCode(code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString()

  // Store in parent_otps table (upsert so re-sends overwrite old codes)
  const { error: upsertError } = await supabaseAdmin
    .from("parent_otps")
    .upsert({ email, code_hash: codeHash, expires_at: expiresAt }, { onConflict: "email" })

  if (upsertError) {
    console.error("[parent-otp/send] upsert error:", upsertError.message)
    return NextResponse.json({ error: "Failed to generate OTP" }, { status: 500 })
  }

  // Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: "Your NaySha EduCore login code",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#07111f;color:#fff;border-radius:16px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#67e8f9;margin:0 0 20px;">NaySha EduCore · Parent Portal</p>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 10px;">Your login code</h1>
        <p style="color:#94a3b8;margin:0 0 28px;font-size:14px;line-height:1.6;">Use this code to sign in to the Parent Panel. It expires in <strong style="color:#fff;">10 minutes</strong>.</p>
        <div style="background:#0f2140;border:1px solid rgba(255,255,255,0.12);border-radius:14px;padding:28px;text-align:center;margin-bottom:28px;">
          <span style="font-size:44px;font-weight:700;letter-spacing:0.35em;color:#ffffff;font-variant-numeric:tabular-nums;">${code}</span>
        </div>
        <p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">If you did not request this code, you can safely ignore this email. Someone may have entered your email address by mistake.</p>
      </div>
    `,
  })

  if (emailError) {
    console.error("[parent-otp/send] email error:", emailError)
    return NextResponse.json({ error: "Failed to send OTP email" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
