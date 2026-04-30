import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email || "").trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 })
  }

  // Verify the email belongs to a parent
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (!parent) {
    return NextResponse.json({ error: "No account found for this email" }, { status: 404 })
  }

  // Ensure auth user exists — bypasses project-level signup restrictions
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
    console.error("[request-otp] createUser error:", createError.message)
    return NextResponse.json({ error: "Failed to initialize account" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
