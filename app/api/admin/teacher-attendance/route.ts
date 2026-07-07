import { NextResponse } from "next/server"
import { requireAuthorizedProfile } from "@/lib/api-auth"
import { supabaseAdmin } from "@/lib/supabase-admin"

function monthStart(month: string) {
  return `${month}-01`
}

function monthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number)
  return new Date(year, monthNumber, 0).toISOString().slice(0, 10)
}

function isSchemaSetupError(error: { code?: string; message?: string; details?: string }) {
  const text = `${error.code || ""} ${error.message || ""} ${error.details || ""}`.toLowerCase()
  return (
    text.includes("teacher_attendance") ||
    text.includes("schema cache") ||
    text.includes("could not find") ||
    text.includes("does not exist") ||
    text.includes("column") ||
    error.code === "42P01" ||
    error.code === "42703" ||
    error.code === "PGRST200" ||
    error.code === "PGRST204"
  )
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value)
}

function getManualTimestamp(date: string, time: string | null) {
  if (!time) return null
  return new Date(`${date}T${time}:00+05:30`).toISOString()
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuthorizedProfile(req, ["admin"])
    if ("response" in auth) return auth.response

    const schoolId = auth.profile.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: "School not found for admin account" }, { status: 403 })
    }

    const url = new URL(req.url)
    const view = url.searchParams.get("view") === "month" ? "month" : "day"
    const date = url.searchParams.get("date") || new Date().toISOString().slice(0, 10)
    const month = url.searchParams.get("month") || date.slice(0, 7)

    let query = supabaseAdmin
      .from("teacher_attendance")
      .select("id, teacher_id, date, status, check_in_time, check_out_time, distance_meters")
      .eq("school_id", schoolId)
      .order("date", { ascending: false })
      .order("check_in_time", { ascending: true })

    if (view === "day") {
      query = query.eq("date", date)
    } else {
      query = query.gte("date", monthStart(month)).lte("date", monthEnd(month))
    }

    const { data: attendanceRows, error: attendanceError } = await query

    if (attendanceError) {
      if (isSchemaSetupError(attendanceError)) {
        return NextResponse.json(
          {
            success: true,
            schemaRefreshing: true,
            message: "Teacher attendance is ready. No records are available yet.",
            records: [],
          },
          { status: 200 }
        )
      }
      return NextResponse.json({ error: attendanceError.message }, { status: 500 })
    }

    const teacherIds = [
      ...new Set(((attendanceRows || []) as { teacher_id: string | null }[]).map((row) => row.teacher_id).filter(Boolean)),
    ] as string[]

    const teacherMap = new Map<string, { name: string | null; email: string | null }>()

    if (teacherIds.length > 0) {
      const { data: teachers } = await supabaseAdmin
        .from("teachers")
        .select("id, name, email")
        .in("id", teacherIds)

      ;((teachers as { id: string; name: string | null; email: string | null }[] | null) || []).forEach((teacher) => {
        teacherMap.set(teacher.id, { name: teacher.name, email: teacher.email })
      })
    }

    const records = ((attendanceRows || []) as any[]).map((row) => {
      const teacher = teacherMap.get(row.teacher_id)
      return {
        ...row,
        teacher_name: teacher?.name ?? null,
        teacher_email: teacher?.email ?? null,
      }
    })

    return NextResponse.json({ success: true, records })
  } catch (err: any) {
    console.error("[admin teacher-attendance GET]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthorizedProfile(req, ["admin"])
    if ("response" in auth) return auth.response

    const schoolId = auth.profile.schoolId
    if (!schoolId) {
      return NextResponse.json({ error: "School not found for admin account" }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const teacherId = String(body.teacherId || "")
    const date = String(body.date || "")
    const status = String(body.status || "")
    const checkInTime = body.checkInTime ? String(body.checkInTime) : null
    const checkOutTime = body.checkOutTime ? String(body.checkOutTime) : null

    if (!teacherId) {
      return NextResponse.json({ error: "Select a teacher" }, { status: 400 })
    }
    if (!isValidDate(date)) {
      return NextResponse.json({ error: "Select a valid date" }, { status: 400 })
    }
    if (!["present", "late", "absent"].includes(status)) {
      return NextResponse.json({ error: "Status must be present, late, or absent" }, { status: 400 })
    }
    if (checkInTime && !isValidTime(checkInTime)) {
      return NextResponse.json({ error: "Check-in time is invalid" }, { status: 400 })
    }
    if (checkOutTime && !isValidTime(checkOutTime)) {
      return NextResponse.json({ error: "Check-out time is invalid" }, { status: 400 })
    }

    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from("teachers")
      .select("id, school_id")
      .eq("id", teacherId)
      .eq("school_id", schoolId)
      .maybeSingle()

    if (teacherError) {
      return NextResponse.json({ error: teacherError.message }, { status: 500 })
    }
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found in this school" }, { status: 404 })
    }

    const checkInIso = status === "absent" ? null : getManualTimestamp(date, checkInTime || "09:00")
    const checkOutIso = status === "absent" ? null : getManualTimestamp(date, checkOutTime)

    const { error } = await supabaseAdmin.from("teacher_attendance").upsert(
      {
        teacher_id: teacher.id,
        school_id: teacher.school_id,
        date,
        status,
        check_in_time: checkInIso,
        check_out_time: checkOutIso,
        check_in_lat: null,
        check_in_lng: null,
        check_out_lat: null,
        check_out_lng: null,
        distance_meters: null,
      },
      { onConflict: "teacher_id,date" }
    )

    if (error) {
      if (isSchemaSetupError(error)) {
        return NextResponse.json(
          { error: "Teacher attendance setup is not installed yet. Run teacher_attendance_schema.sql in Supabase SQL Editor." },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[admin teacher-attendance POST]", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
