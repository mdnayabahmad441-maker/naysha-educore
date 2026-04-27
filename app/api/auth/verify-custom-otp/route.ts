import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { consumeRateLimit, getClientIp } from "@/lib/security"
import { verifyOtp } from "@/lib/otp"
import crypto from "crypto"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Plain client (no PKCE) used to sign in with temp password and get session tokens
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
)

async function findOrCreateUser(email: string): Promise<string> {
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const existing = list?.users?.find(u => u.email?.toLowerCase() === email)

  if (existing) {
    if (!existing.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { email_confirm: true })
    }
    return existing.id
  }

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create user: ${error.message}`)
  if (!created?.user?.id) throw new Error("User creation returned no ID")
  return created.user.id
}

async function createSession(email: string, userId: string) {
  // Set a temporary password, sign in to get real session tokens, then rotate it
  const tempPass = crypto.randomUUID() + "-" + crypto.randomUUID()

  const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: tempPass,
  })
  if (pwErr) throw new Error(`Password update failed: ${pwErr.message}`)

  const { data: signInData, error: signInErr } = await supabaseAnon.auth.signInWithPassword({
    email,
    password: tempPass,
  })

  // Rotate to unknown password immediately so the temp password cannot be reused
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: crypto.randomUUID() + crypto.randomUUID() + crypto.randomUUID(),
  })

  if (signInErr || !signInData?.session) {
    throw new Error(`Session creation failed: ${signInErr?.message || "no session"}`)
  }

  return signInData.session
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`verify-otp:${ip}`, 10, 15 * 60_000)

  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 })
  }

  try {
    const body = await request.json()
    const email = String(body?.email || "").trim().toLowerCase()
    const code = String(body?.code || "").trim()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    if (!verifyOtp(email, code)) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    const userId = await findOrCreateUser(email)
    const session = await createSession(email, userId)

    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
  } catch (err: any) {
    console.error("Custom OTP verify error:", err?.message || err)
    return NextResponse.json(
      { error: err?.message || "Verification failed" },
      { status: 500 }
    )
  }
}
