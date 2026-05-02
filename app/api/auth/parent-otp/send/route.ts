import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"
import { Resend } from "resend"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`parent-otp-send:${ip}`, 3, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute before requesting another link." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Verify parent exists — anti-enumeration: always return success if not found
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", email)
    .maybeSingle()

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

  // Generate magic link via admin API — bypasses all Supabase auth restrictions
  const origin = request.headers.get("origin") ||
    `https://${request.headers.get("host")}` ||
    "https://nayshaschool.naysha.online"

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${origin}/auth/callback?next=/parent` },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[parent-otp/send] generateLink error:", linkError?.message)
    return NextResponse.json({ error: "Failed to generate login link" }, { status: 500 })
  }

  const loginLink = linkData.properties.action_link

  // Send email via Resend
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
    to: email,
    subject: "Your NaySha EduCore login link",
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#07111f;color:#fff;border-radius:16px;">
        <p style="font-size:11px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#67e8f9;margin:0 0 20px;">NaySha EduCore · Parent Portal</p>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 10px;">Your login link</h1>
        <p style="color:#94a3b8;margin:0 0 28px;font-size:14px;line-height:1.6;">Click the button below to sign in to the Parent Panel. This link expires in <strong style="color:#fff;">1 hour</strong>.</p>
        <a href="${loginLink}" style="display:block;background:linear-gradient(135deg,#0ea5e9,#2563eb);color:#fff;text-decoration:none;text-align:center;padding:16px 24px;border-radius:14px;font-size:15px;font-weight:600;margin-bottom:28px;">
          Sign In to Parent Portal
        </a>
        <p style="color:#475569;font-size:12px;margin:0;line-height:1.6;">If you did not request this, ignore this email. The link only works once.</p>
      </div>
    `,
  })

  if (emailError) {
    console.error("[parent-otp/send] email error:", emailError)
    return NextResponse.json({ error: "Failed to send login email" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
