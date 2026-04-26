import { NextRequest, NextResponse } from "next/server"
import { resolveIdentifierToAccount } from "@/lib/auth-resolver"
import { consumeRateLimit, getClientIp } from "@/lib/security"

const GENERIC_NOT_FOUND = { error: "Account not found" }

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

    const account = await resolveIdentifierToAccount(identifier)

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
