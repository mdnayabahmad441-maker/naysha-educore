import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { AccountRole, resolveUserAccess } from "@/lib/auth-resolver"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization")
  const accessToken = authHeader?.replace("Bearer ", "").trim()

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken)

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const preferredRole =
      body?.preferredRole === "admin" || body?.preferredRole === "teacher" || body?.preferredRole === "parent"
        ? (body.preferredRole as AccountRole)
        : null

    const access = await resolveUserAccess(user, preferredRole)

    if (!access) {
      return NextResponse.json({ error: "No account found for this email" }, { status: 404 })
    }

    return NextResponse.json({
      next: access.next,
      subdomain: access.subdomain,
      role: access.role,
      school_id: access.schoolId,
      student_ids: access.studentIds,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to resolve destination",
      },
      { status: 500 }
    )
  }
}
