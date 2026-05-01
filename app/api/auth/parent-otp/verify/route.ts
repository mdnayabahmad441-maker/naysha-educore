import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"
import { createHash } from "crypto"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CODE_RE = /^\d{6}$/
const OTP_SECRET = process.env.OTP_SECRET || "naysha-otp-secret"

function hashCode(code: string): string {
  return createHash("sha256").update(`${code}:${OTP_SECRET}`).digest("hex")
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  // Strict limit: 5 attempts per minute per IP to prevent brute force
  const limit = consumeRateLimit(`parent-otp-verify:${ip}`, 5, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()
  const code = String(body?.code || "").trim()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  if (!code || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "Enter the 6-digit code from your email" }, { status: 400 })
  }

  // Look up the stored OTP
  const { data: otpRow } = await supabaseAdmin
    .from("parent_otps")
    .select("code_hash, expires_at")
    .eq("email", email)
    .maybeSingle()

  if (!otpRow) {
    return NextResponse.json({ error: "No OTP found. Please request a new code." }, { status: 400 })
  }

  if (new Date(otpRow.expires_at) < new Date()) {
    await supabaseAdmin.from("parent_otps").delete().eq("email", email)
    return NextResponse.json({ error: "Code has expired. Please request a new one." }, { status: 400 })
  }

  if (hashCode(code) !== otpRow.code_hash) {
    return NextResponse.json({ error: "Incorrect code. Please try again." }, { status: 400 })
  }

  // Valid — delete the used OTP immediately
  await supabaseAdmin.from("parent_otps").delete().eq("email", email)

  // Generate a magic link token via admin API so the client can create a real session
  const origin = request.headers.get("origin") ||
    request.headers.get("x-forwarded-proto") + "://" + request.headers.get("host") ||
    "http://localhost:3000"

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error("[parent-otp/verify] generateLink error:", linkError?.message)
    return NextResponse.json({ error: "Failed to create session. Please try again." }, { status: 500 })
  }

  // Extract the token from the action_link URL so the client can call verifyOtp
  const actionUrl = new URL(linkData.properties.action_link)
  const magicToken = actionUrl.searchParams.get("token")

  if (!magicToken) {
    return NextResponse.json({ error: "Failed to extract session token." }, { status: 500 })
  }

  return NextResponse.json({ success: true, token: magicToken })
}
