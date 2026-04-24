import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const identifier = String(body?.identifier || "").trim().toLowerCase()

    if (!identifier) {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 })
    }

    if (EMAIL_PATTERN.test(identifier)) {
      return NextResponse.json({ email: identifier })
    }

    let page = 1

    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const matchedUser = data.users.find((user) => {
        const username = String(user.user_metadata?.username || "").trim().toLowerCase()
        return username === identifier
      })

      if (matchedUser?.email) {
        return NextResponse.json({ email: matchedUser.email.toLowerCase() })
      }

      if (data.users.length < 200) {
        break
      }

      page += 1
    }

    return NextResponse.json({ error: "User not found" }, { status: 404 })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
