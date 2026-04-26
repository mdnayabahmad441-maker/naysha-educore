import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

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

  const email = String(user.email || "").trim().toLowerCase()

  try {
    const { data: byAuthId } = await supabaseAdmin
      .from("parents")
      .select("id, student_id, school_id")
      .eq("auth_id", user.id)

    let parentRows = byAuthId || []

    if (parentRows.length === 0 && email) {
      const { data: byEmail } = await supabaseAdmin
        .from("parents")
        .select("id, student_id, school_id")
        .ilike("email", email)

      parentRows = byEmail || []
    }

    if (parentRows.length === 0) {
      return NextResponse.json({ error: "Parent account not found" }, { status: 404 })
    }

    const studentIds = [...new Set(
      parentRows
        .map((row) => row.student_id)
        .filter((value): value is string => Boolean(value))
    )]

    let schoolId =
      parentRows
        .map((row) => row.school_id)
        .find((value): value is string => Boolean(value)) || null

    if (!schoolId && studentIds.length > 0) {
      const { data: students } = await supabaseAdmin
        .from("students")
        .select("id, school_id")
        .in("id", studentIds)

      schoolId =
        (students || [])
          .map((student) => student.school_id)
          .find((value): value is string => Boolean(value)) || null
    }

    if (!schoolId) {
      return NextResponse.json({ error: "Parent school not found" }, { status: 404 })
    }

    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .upsert({
          id: user.id,
          school_id: schoolId,
          role: "parent",
        }),
      supabaseAdmin
        .from("parents")
        .update({ auth_id: user.id, school_id: schoolId })
        .ilike("email", email),
      supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          school_id: schoolId,
          role: "parent",
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      role: "parent",
      schoolId,
      studentIds,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve parent access" },
      { status: 500 }
    )
  }
}
