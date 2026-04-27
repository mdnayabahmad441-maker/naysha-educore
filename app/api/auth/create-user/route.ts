import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json()

    if (!email || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // 1. Create user in auth
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true
    })

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message }, { status: 400 })
    }

    const userId = data.user.id

    // 2. Insert into correct table
    if (role === "admin") {
      await supabaseAdmin.from("admins").insert({ id: userId, email })
    }

    if (role === "teacher") {
      await supabaseAdmin.from("teachers").insert({ id: userId, email })
    }

    if (role === "parent") {
      await supabaseAdmin.from("parents").insert({ id: userId, email })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}