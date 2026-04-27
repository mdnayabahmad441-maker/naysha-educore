import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { resolveAccountByEmail } from "@/lib/auth-resolver"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ✅ IMPORTANT: Use SERVICE ROLE KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    // ✅ OPTIONAL VALIDATION (DOES NOT BLOCK OTP)
    try {
      const account = await resolveAccountByEmail(email)

      if (purpose === "parent-login" && account?.role !== "parent") {
        console.warn("Not a parent, but allowing OTP:", email)
      }

      if (purpose === "account-setup" && !account) {
        console.warn("Account not found, but allowing OTP:", email)
      }
    } catch (e) {
      console.warn("Account check failed, continuing anyway")
    }

    // ✅ MAIN OTP SEND
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // IMPORTANT
      },
    })

    // ❌ ONLY FAIL IF REAL ERROR
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // ✅ ALWAYS SUCCESS
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error("OTP API error:", err)

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    )
  }
}