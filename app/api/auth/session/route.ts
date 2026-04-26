import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { resolveUserAccess } from "@/lib/auth-resolver"

export async function GET(request: NextRequest) {
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
    const access = await resolveUserAccess(user)

    if (!access) {
      return NextResponse.json({ error: "No authorized account found" }, { status: 404 })
    }

    return NextResponse.json({
      userId: access.userId,
      email: access.email,
      role: access.role,
      schoolId: access.schoolId,
      subdomain: access.subdomain,
      next: access.next,
      studentIds: access.studentIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve session" },
      { status: 500 }
    )
  }
}
