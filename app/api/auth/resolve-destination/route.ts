import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function findSchoolSubdomain(schoolId: string) {
  const { data } = await supabaseAdmin
    .from("schools")
    .select("subdomain")
    .eq("id", schoolId)
    .maybeSingle()
  return (data?.subdomain as string | null) ?? null
}

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
    const email = String(body?.email || "").trim().toLowerCase()
    const userId = user.id

    // Look up parents — first by auth_id, then by email (avoids .or() parsing issues with email chars)
    const { data: byAuthId } = await supabaseAdmin
      .from("parents")
      .select("id, student_id, school_id")
      .eq("auth_id", userId)

    let parentRows: Array<{ id: string; student_id: string | null; school_id: string | null }> =
      byAuthId || []

    if (parentRows.length === 0) {
      const { data: byEmail } = await supabaseAdmin
        .from("parents")
        .select("id, student_id, school_id")
        .ilike("email", email)
      parentRows = byEmail || []
    }

    const parent = parentRows[0]

    if (parent) {
      let schoolId = parent.school_id

      if (!schoolId) {
        const studentIds = parentRows
          .map((r) => r.student_id)
          .filter((id): id is string => Boolean(id))

        if (studentIds.length > 0) {
          const { data: students } = await supabaseAdmin
            .from("students")
            .select("school_id")
            .in("id", studentIds)

          schoolId =
            ((students as Array<{ school_id: string | null }> | null) || [])
              .map((s) => s.school_id)
              .find((v): v is string => Boolean(v)) ?? null
        }
      }

      if (!schoolId) {
        return NextResponse.json({ error: "Parent linked school not found" }, { status: 404 })
      }

      const subdomain = await findSchoolSubdomain(schoolId)
      if (!subdomain) {
        return NextResponse.json({ error: "School not found" }, { status: 404 })
      }

      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, school_id: schoolId, role: "parent" }),
        supabaseAdmin
          .from("parents")
          .update({ auth_id: userId, school_id: schoolId })
          .ilike("email", email),
        supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { ...user.user_metadata, school_id: schoolId, role: "parent" },
        }),
      ])

      return NextResponse.json({ next: "/parent", subdomain })
    }

    // Check teachers
    const { data: teacher } = await supabaseAdmin
      .from("teachers")
      .select("id, school_id")
      .ilike("email", email)
      .maybeSingle()

    if (teacher) {
      const subdomain = await findSchoolSubdomain(teacher.school_id)
      if (!subdomain) {
        return NextResponse.json({ error: "School not found" }, { status: 404 })
      }

      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .upsert({ id: userId, school_id: teacher.school_id, role: "teacher" }),
        supabaseAdmin.from("teachers").update({ auth_id: userId }).eq("id", teacher.id),
        supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: { ...user.user_metadata, school_id: teacher.school_id, role: "teacher" },
        }),
      ])

      return NextResponse.json({ next: "/teacher", subdomain })
    }

    // Check schools (admin)
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id, subdomain")
      .ilike("email", email)
      .maybeSingle()

    if (!school?.subdomain) {
      return NextResponse.json(
        { error: "No parent, teacher, or admin account found for this email" },
        { status: 404 }
      )
    }

    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .upsert({ id: userId, school_id: school.id, role: "admin" }),
      supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { ...user.user_metadata, school_id: school.id, role: "admin" },
      }),
    ])

    return NextResponse.json({ next: "/admin", subdomain: school.subdomain })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to resolve destination" },
      { status: 500 }
    )
  }
}
