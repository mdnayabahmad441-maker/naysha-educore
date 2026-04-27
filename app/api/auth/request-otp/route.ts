import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveAccountByEmail } from "@/lib/auth-resolver"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function generateOtpCode(email: string): Promise<string> {
  // Try to generate link (returns email_otp without using Supabase's email delivery)
  let result = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  // If user doesn't exist in Supabase auth yet, create them first then retry
  if (result.error) {
    const createResult = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
    })

    if (createResult.error && !createResult.error.message.includes("already been registered")) {
      throw new Error(createResult.error.message)
    }

    result = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    })
  }

  if (result.error) throw new Error(result.error.message)

  const otp = result.data?.properties?.email_otp
  if (!otp) throw new Error("Could not generate OTP code")

  return otp
}

async function sendOtpEmail(origin: string, email: string, otp: string) {
  const response = await fetch(`${origin}/api/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-service-key": process.env.SUPABASE_SERVICE_ROLE_KEY!,
    },
    body: JSON.stringify({
      email,
      subject: "Your NaySha ERP login code",
      message: `Your one-time login code is: <strong style="font-size:24px;letter-spacing:4px">${otp}</strong><br/><br/>This code expires in 10 minutes. Do not share it with anyone.`,
    }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data?.error || "Failed to send email")
  }
}

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
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
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

    const origin = new URL(request.url).origin
    const otp = await generateOtpCode(email)
    await sendOtpEmail(origin, email, otp)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("OTP API error:", err)
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
