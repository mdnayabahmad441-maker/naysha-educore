import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{4,50}$/
const GENERIC_NOT_FOUND = { error: "Account not found" }

type AccountRole = "admin" | "teacher" | "parent"
type LoginMethod = "password" | "otp"

async function resolveEmailAccount(email: string) {
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

  if (teacher?.id) {
    return {
      email: normalizedEmail,
      role: "teacher" as AccountRole,
      loginMethod: "password" as LoginMethod,
    }
  }

  if (school?.id) {
    return {
      email: normalizedEmail,
      role: "admin" as AccountRole,
      loginMethod: "password" as LoginMethod,
    }
  }

  if ((parents || []).length > 0) {
    return {
      email: normalizedEmail,
      role: "parent" as AccountRole,
      loginMethod: "otp" as LoginMethod,
    }
  }

  return null
}

async function resolveUsername(identifier: string) {
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error("Lookup failed")
    }

    const matchedUser = data.users.find((user) => {
      const username = String(user.user_metadata?.username || "").trim().toLowerCase()
      return username === identifier
    })

    if (matchedUser?.email) {
      return matchedUser.email.toLowerCase()
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return null
}

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

    let resolvedEmail: string | null = null

    if (EMAIL_PATTERN.test(identifier)) {
      resolvedEmail = identifier
    } else if (USERNAME_PATTERN.test(identifier)) {
      resolvedEmail = await resolveUsername(identifier)
    } else {
      return NextResponse.json(GENERIC_NOT_FOUND, {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      })
    }

    if (!resolvedEmail) {
      return NextResponse.json(GENERIC_NOT_FOUND, {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      })
    }

    const account = await resolveEmailAccount(resolvedEmail)

    if (!account) {
      return NextResponse.json(GENERIC_NOT_FOUND, {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
        },
      })
    }

    return NextResponse.json(account, {
      headers: {
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    )
  }
}
