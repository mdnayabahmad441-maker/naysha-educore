import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

async function findSchoolSubdomain(schoolId: string) {
  const { data } = await supabaseAdmin
    .from("schools")
    .select("subdomain, domain")
    .eq("id", schoolId)
    .maybeSingle()

  // Fall back to domain for schools created before the subdomain migration
  return (data?.subdomain || data?.domain || null) as string | null
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
    const preferredRole = String(body?.preferredRole || "").trim().toLowerCase()
    const userId = user.id

    const allowParent = !preferredRole || preferredRole === "parent"
    const allowTeacher = !preferredRole || preferredRole === "teacher"
    const allowAdmin = !preferredRole || preferredRole === "admin"

    // =========================
    // 🔹 CHECK PARENT
    // =========================
    if (allowParent) {
      const { data: byAuthId } = await supabaseAdmin
        .from("parents")
        .select("id, student_id, school_id")
        .eq("auth_id", userId)

      let parentRows =
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
              (students || [])
                .map((s) => s.school_id)
                .find((v): v is string => Boolean(v)) ?? null
          }
        }

        if (!schoolId) {
          // Last-resort: check if this auth user already has school_id in metadata
          const existingMetaSchool = user.user_metadata?.school_id
          if (typeof existingMetaSchool === "string" && existingMetaSchool) {
            schoolId = existingMetaSchool
          }
        }

        if (!schoolId) {
          return NextResponse.json(
            { error: "Parent linked school not found" },
            { status: 404 }
          )
        }

        const subdomain = await findSchoolSubdomain(schoolId)

        if (!subdomain) {
          return NextResponse.json(
            { error: "School not found" },
            { status: 404 }
          )
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
            user_metadata: {
              ...user.user_metadata,
              school_id: schoolId,
              role: "parent",
            },
          }),
        ])

        return NextResponse.json({
          next: "/parent",
          subdomain,
          role: "parent",
          school_id: schoolId,
        })
      }

      if (preferredRole === "parent") {
        return NextResponse.json(
          { error: "Parent account not found for this email" },
          { status: 404 }
        )
      }
    }

    // =========================
    // 🔹 CHECK TEACHER
    // =========================
    const teacher = allowTeacher
      ? (await supabaseAdmin
          .from("teachers")
          .select("id, school_id")
          .ilike("email", email)
          .maybeSingle()).data
      : null

    if (teacher) {
      const subdomain = await findSchoolSubdomain(teacher.school_id)

      if (!subdomain) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        )
      }

      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .upsert({
            id: userId,
            school_id: teacher.school_id,
            role: "teacher",
          }),

        supabaseAdmin
          .from("teachers")
          .update({ auth_id: userId })
          .eq("id", teacher.id),

        supabaseAdmin.auth.admin.updateUserById(userId, {
          user_metadata: {
            ...user.user_metadata,
            school_id: teacher.school_id,
            role: "teacher",
          },
        }),
      ])

      // ✅ FIXED RESPONSE
      return NextResponse.json({
        next: "/teacher",
        subdomain,
        role: "teacher",
        school_id: teacher.school_id,
      })
    }

    // =========================
    // 🔹 CHECK ADMIN
    // =========================
    const school = allowAdmin
      ? (await supabaseAdmin
          .from("schools")
          .select("id, subdomain, domain")
          .ilike("email", email)
          .maybeSingle()).data
      : null

    const adminSubdomain = school?.subdomain || school?.domain || null

    if (!school || !adminSubdomain) {
      return NextResponse.json(
        { error: "No account found for this email" },
        { status: 404 }
      )
    }

    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .upsert({
          id: userId,
          school_id: school.id,
          role: "admin",
        }),

      supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...user.user_metadata,
          school_id: school.id,
          role: "admin",
        },
      }),
    ])

    return NextResponse.json({
      next: "/admin",
      subdomain: adminSubdomain,
      role: "admin",
      school_id: school.id,
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
