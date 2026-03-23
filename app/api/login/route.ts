import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {

  try {

    const { username, pin } = await req.json()

    if (!username || !pin) {
      return NextResponse.json(
        { error: "Missing credentials" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .eq("username", username)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const match = await bcrypt.compare(pin, data.pin)

    if (!match) {
      return NextResponse.json(
        { error: "Invalid PIN" },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.id,
        username: data.username,
        school_id: data.school_id
      }
    })

  } catch (err) {
    console.error("LOGIN ERROR:", err)
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}