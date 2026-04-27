import { NextRequest, NextResponse } from "next/server"
import { resolveAccountByEmail } from "@/lib/auth-resolver"
import { consumeRateLimit, getClientIp } from "@/lib/security"
import { generateOtp } from "@/lib/otp"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`request-otp:${ip}`, 8, 10 * 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const purpose = String(body?.purpose || "")

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    // Optional role check — never blocks OTP
    try {
      const account = await resolveAccountByEmail(email)
      if (purpose === "parent-login" && account?.role !== "parent") {
        console.warn("Not a parent, but allowing OTP:", email)
      }
      if (purpose === "account-setup" && !account) {
        console.warn("Account not found, but allowing OTP:", email)
      }
    } catch {
      console.warn("Account check failed, continuing anyway")
    }

    // Generate HMAC OTP — no Supabase email system involved
    const otp = generateOtp(email)

    const origin = new URL(request.url).origin
    const emailRes = await fetch(`${origin}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": process.env.SUPABASE_SERVICE_ROLE_KEY!,
      },
      body: JSON.stringify({
        email,
        subject: "Your NaySha ERP login code",
        message: `Your one-time login code is:<br/><br/><strong style="font-size:28px;letter-spacing:6px;font-family:monospace">${otp}</strong><br/><br/>This code is valid for 10 minutes. Do not share it with anyone.`,
      }),
    })

    if (!emailRes.ok) {
      const data = await emailRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: data?.error || "Failed to send OTP email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("OTP request error:", err?.message || err)
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
