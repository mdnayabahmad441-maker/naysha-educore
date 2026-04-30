import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`setup-account:${ip}`, 5, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)) } }
    )
  }

  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  // Check if email belongs to any registered role in parallel
  const [parentRes, teacherRes, schoolRes] = await Promise.all([
    supabaseAdmin.from("parents").select("id").eq("email", email).maybeSingle(),
    supabaseAdmin.from("teachers").select("id").eq("email", email).maybeSingle(),
    supabaseAdmin.from("schools").select("id").eq("email", email).maybeSingle(),
  ])

  const isRegistered = parentRes.data || teacherRes.data || schoolRes.data

  // Always return success to prevent email enumeration
  if (!isRegistered) {
    return NextResponse.json({ success: true })
  }

  // Ensure Supabase auth account exists — bypasses project-level signup restrictions
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
    console.error("[setup-account] createUser error:", createError.message)
    return NextResponse.json({ error: "Failed to initialize account" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
