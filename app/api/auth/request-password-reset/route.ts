import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const supabaseAuthClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`password-reset:${ip}`, 5, 15 * 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many reset requests. Please try again later." },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()

    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const redirectTo = `${new URL(request.url).origin}/reset-password`

    const { error } = await supabaseAuthClient.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
