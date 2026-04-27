import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveAccountByEmail } from "@/lib/auth-resolver"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function ensureAuthUserExists(email: string): Promise<string> {
  // Try to find existing user in Supabase auth
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())

  if (existing) {
    // Confirm email if not already confirmed — unconfirmed users block generateLink
    if (!existing.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true })
    }
    return existing.id
  }

  // Create new confirmed user
  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (createError) throw new Error(`User creation failed: ${createError.message}`)
  if (!created?.user?.id) throw new Error("User creation returned no ID")
  return created.user.id
}

async function generateOtpCode(email: string): Promise<string> {
  await ensureAuthUserExists(email)

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  })

  if (error) throw new Error(`OTP generation failed: ${error.message}`)

  const otp = data?.properties?.email_otp
  if (!otp) throw new Error("OTP not returned by Supabase — check project email settings")

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
    throw new Error(data?.error || "Email delivery failed")
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

    const origin = new URL(request.url).origin
    const otp = await generateOtpCode(email)
    await sendOtpEmail(origin, email, otp)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("OTP API error:", err?.message || err)
    return NextResponse.json(
      { error: err?.message || "Something went wrong" },
      { status: 500 }
    )
  }
}
