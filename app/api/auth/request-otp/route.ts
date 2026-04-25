import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabaseAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function hasRecognizedAccount(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const [{ data: teacher }, { data: school }, { data: parents }] = await Promise.all([
    supabaseAdmin
      .from("teachers")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("schools")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("parents")
      .select("id")
      .ilike("email", normalizedEmail)
      .limit(1),
  ])

  return Boolean(teacher?.id || school?.id || (parents || []).length > 0)
}

async function hasParentAccount(email: string) {
  const { data } = await supabaseAdmin
    .from("parents")
    .select("id")
    .ilike("email", email.trim().toLowerCase())
    .limit(1)

  return (data || []).length > 0
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`request-otp:${ip}`, 8, 10 * 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many OTP requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const purpose = String(body?.purpose || "")
    let shouldCreateUser = Boolean(body?.shouldCreateUser)

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    if (purpose === "account-setup") {
      const recognizedAccount = await hasRecognizedAccount(email)

      if (!recognizedAccount) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 })
      }

      shouldCreateUser = true
    }

    if (purpose === "parent-login") {
      const parentExists = await hasParentAccount(email)

      if (!parentExists) {
        return NextResponse.json({ error: "Parent account not found" }, { status: 404 })
      }

      shouldCreateUser = true
    }

    const { error } = await supabaseAuthClient.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
