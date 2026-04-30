import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`send-parent-otp:${ip}`, 5, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) },
      }
    )
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Verify this is actually a registered parent
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  // Return success even when not found to prevent email enumeration.
  // The OTP send on the client will silently fail for unknown emails.
  if (!parent) {
    return NextResponse.json({ success: true })
  }

  // Ensure the email has a Supabase auth account.
  // admin.createUser bypasses the project-level "Signups not allowed" restriction.
  const { error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  // Ignore "already registered" — user already has an auth account, that's fine
  if (
    createError &&
    !createError.message.toLowerCase().includes("already registered") &&
    !createError.message.toLowerCase().includes("already been registered") &&
    !createError.message.toLowerCase().includes("already exists")
  ) {
    console.error("[send-parent-otp] createUser error:", createError.message)
    return NextResponse.json({ error: "Failed to initialize account" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
