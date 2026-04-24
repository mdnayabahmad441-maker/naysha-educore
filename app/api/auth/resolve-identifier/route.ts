import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{4,50}$/
const GENERIC_NOT_FOUND = { error: "Invalid credentials" }

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers)
  const limit = consumeRateLimit(`resolve-identifier:${ip}`, 20, 60_000)

  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
          "Cache-Control": "no-store",
        },
      }
    )
  }

  try {
    const body = await request.json()
    const identifier = String(body?.identifier || "").trim().toLowerCase()

    if (!identifier) {
      return NextResponse.json({ error: "Identifier is required" }, { status: 400 })
    }

    if (EMAIL_PATTERN.test(identifier)) {
      return NextResponse.json(
        { email: identifier },
        {
          headers: {
            "Cache-Control": "no-store",
          },
        }
      )
    }

    if (!USERNAME_PATTERN.test(identifier)) {
      return NextResponse.json(GENERIC_NOT_FOUND, {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      })
    }

    let page = 1

    while (page <= 10) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      })

      if (error) {
        return NextResponse.json(
          { error: "Lookup failed" },
          {
            status: 500,
            headers: {
              "Cache-Control": "no-store",
            },
          }
        )
      }

      const matchedUser = data.users.find((user) => {
        const username = String(user.user_metadata?.username || "").trim().toLowerCase()
        return username === identifier
      })

      if (matchedUser?.email) {
        return NextResponse.json(
          { email: matchedUser.email.toLowerCase() },
          {
            headers: {
              "Cache-Control": "no-store",
            },
          }
        )
      }

      if (data.users.length < 200) {
        break
      }

      page += 1
    }

    return NextResponse.json(GENERIC_NOT_FOUND, {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
