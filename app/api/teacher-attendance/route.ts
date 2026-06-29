import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAuthorizedProfile } from "@/lib/api-auth"

const RADIUS_METERS = 100
const MAX_ALLOWED_ACCURACY_METERS = 250
const SETUP_ERROR_MESSAGE =
  "Teacher attendance database permissions are not ready. Ask your admin to run the updated teacher_attendance_schema.sql in Supabase SQL Editor."

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getTimeStatus(now: Date, start: string, end: string, lateAfter: string) {
  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }
  const current = now.getHours() * 60 + now.getMinutes()
  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  const lateMin = toMinutes(lateAfter)

  if (current < startMin) return { allowed: false, reason: `Attendance opens at ${start}` }
  if (current > endMin) return { allowed: false, reason: `Attendance closed at ${end}` }
  return { allowed: true, late: current >= lateMin }
}

function isTeacherAttendanceSetupError(message = "") {
  const text = message.toLowerCase()
  return (
    (text.includes("teacher_attendance") &&
      (text.includes("does not exist") || text.includes("schema cache") || text.includes("permission denied"))) ||
    text.includes("permission denied for schema")
  )
}

// GET — teacher fetches their own attendance history
export async function GET(req: Request) {
  try {
    const auth = await requireAuthorizedProfile(req, ["teacher"])
    if ("response" in auth) return auth.response

    const url = new URL(req.url)
    const month = url.searchParams.get("month") // YYYY-MM

    // Resolve teacher by auth_id first, fall back to email
    let teacher: { id: string; school_id: string } | null = null

    const { data: byAuthId } = await supabaseAdmin
      .from("teachers")
      .select("id, school_id")
      .eq("auth_id", auth.profile.userId)
      .maybeSingle()

    if (byAuthId) {
      teacher = byAuthId
    } else {
      // Fallback: look up via auth user email
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(auth.profile.userId)
      const email = userData?.user?.email?.trim().toLowerCase()
      if (email) {
        const { data: byEmail } = await supabaseAdmin
          .from("teachers")
          .select("id, school_id")
          .eq("email", email)
          .maybeSingle()
        teacher = byEmail
      }
    }

    if (!teacher) return NextResponse.json({ error: "Teacher record not found" }, { status: 404 })

    let query = supabaseAdmin
      .from("teacher_attendance")
      .select("*")
      .eq("teacher_id", teacher.id)
      .order("date", { ascending: false })

    if (month) {
      query = query.gte("date", `${month}-01`).lte("date", `${month}-31`)
    } else {
      query = query.limit(30)
    }

    const { data, error } = await query
    if (error) {
      console.error("[teacher-attendance GET]", error.message)
      // Table missing — give an actionable message
      if (isTeacherAttendanceSetupError(error.message)) {
        return NextResponse.json({ error: SETUP_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, records: data || [] })
  } catch (err: any) {
    console.error("[teacher-attendance GET] Uncaught:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

// POST — teacher marks check-in or check-out
export async function POST(req: Request) {
  try {
  const auth = await requireAuthorizedProfile(req, ["teacher"])
  if ("response" in auth) return auth.response

  const body = await req.json()
  const action: "check_in" | "check_out" = body.action
  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)
  const accuracy = Number(body.accuracy)

  if (!action || !["check_in", "check_out"].includes(action)) {
    return NextResponse.json({ error: "action must be check_in or check_out" }, { status: 400 })
  }
  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: "Valid latitude and longitude required" }, { status: 400 })
  }
  if (isNaN(accuracy) || accuracy <= 0) {
    return NextResponse.json({ error: "GPS accuracy is required. Tap Get My Location again." }, { status: 400 })
  }
  if (accuracy > MAX_ALLOWED_ACCURACY_METERS) {
    return NextResponse.json(
      {
        error: `Location accuracy is too low (±${Math.round(accuracy)}m). Turn on precise location/GPS or try from a phone, then try again.`,
      },
      { status: 422 }
    )
  }

  // Resolve teacher — try auth_id first, fall back to email
  let teacher: { id: string; school_id: string } | null = null

  const { data: byAuthId } = await supabaseAdmin
    .from("teachers")
    .select("id, school_id")
    .eq("auth_id", auth.profile.userId)
    .maybeSingle()

  if (byAuthId) {
    teacher = byAuthId
  } else {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(auth.profile.userId)
    const email = userData?.user?.email?.trim().toLowerCase()
    if (email) {
      const { data: byEmail } = await supabaseAdmin
        .from("teachers")
        .select("id, school_id")
        .eq("email", email)
        .maybeSingle()
      teacher = byEmail
    }
  }

  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 })

  // Fetch school location + timing
  const { data: school, error: schoolError } = await supabaseAdmin
    .from("schools")
    .select("latitude, longitude, check_in_start, check_in_end, late_after")
    .eq("id", teacher.school_id)
    .maybeSingle()

  if (schoolError) {
    console.error("[teacher-attendance POST] School location config error:", schoolError.message)
    if (schoolError.message.includes("latitude") || schoolError.message.includes("schema cache")) {
      return NextResponse.json(
        { error: "Teacher attendance setup is not installed yet. Ask your admin to run teacher_attendance_schema.sql in Supabase." },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: schoolError.message }, { status: 500 })
  }

  if (!school?.latitude || !school?.longitude) {
    return NextResponse.json(
      { error: "School location not configured. Ask your admin to set the school GPS coordinates." },
      { status: 422 }
    )
  }

  // Distance check
  const distance = Math.round(haversineDistance(latitude, longitude, Number(school.latitude), Number(school.longitude)))
  const effectiveDistance = Math.max(0, distance - Math.round(accuracy))

  if (effectiveDistance > RADIUS_METERS) {
    return NextResponse.json(
      {
        error: `You are about ${distance}m from school (GPS accuracy ±${Math.round(accuracy)}m). Must be within ${RADIUS_METERS}m to mark attendance.`,
        distance,
        accuracy: Math.round(accuracy),
      },
      { status: 403 }
    )
  }

  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  // Time window check (only for check-in)
  if (action === "check_in") {
    const start = school.check_in_start || "07:00"
    const end = school.check_in_end || "10:30"
    const lateAfter = school.late_after || "09:00"
    const timeCheck = getTimeStatus(now, start, end, lateAfter)

    if (!timeCheck.allowed) {
      return NextResponse.json({ error: timeCheck.reason }, { status: 403 })
    }

    // Upsert check-in
    const status = timeCheck.late ? "late" : "present"

    const { data: existing, error: existingError } = await supabaseAdmin
      .from("teacher_attendance")
      .select("id, check_in_time")
      .eq("teacher_id", teacher.id)
      .eq("date", today)
      .maybeSingle()

    if (existingError) {
      if (isTeacherAttendanceSetupError(existingError.message)) {
        return NextResponse.json({ error: SETUP_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({ error: existingError.message }, { status: 500 })
    }

    if (existing?.check_in_time) {
      return NextResponse.json({ error: "Already checked in today" }, { status: 409 })
    }

    const { error } = await supabaseAdmin.from("teacher_attendance").upsert({
      teacher_id: teacher.id,
      school_id: teacher.school_id,
      date: today,
      status,
      check_in_time: now.toISOString(),
      check_in_lat: latitude,
      check_in_lng: longitude,
      distance_meters: distance,
    }, { onConflict: "teacher_id,date" })

    if (error) {
      if (isTeacherAttendanceSetupError(error.message)) {
        return NextResponse.json({ error: SETUP_ERROR_MESSAGE }, { status: 503 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: "check_in", status, distance })
  }

  // Check-out — no time restriction, but must have checked in first
  const { data: record, error: recordError } = await supabaseAdmin
    .from("teacher_attendance")
    .select("id, check_in_time, check_out_time")
    .eq("teacher_id", teacher.id)
    .eq("date", today)
    .maybeSingle()

  if (recordError) {
    if (isTeacherAttendanceSetupError(recordError.message)) {
      return NextResponse.json({ error: SETUP_ERROR_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ error: recordError.message }, { status: 500 })
  }

  if (!record?.check_in_time) {
    return NextResponse.json({ error: "You have not checked in today" }, { status: 409 })
  }
  if (record.check_out_time) {
    return NextResponse.json({ error: "Already checked out today" }, { status: 409 })
  }

  const { error } = await supabaseAdmin
    .from("teacher_attendance")
    .update({
      check_out_time: now.toISOString(),
      check_out_lat: latitude,
      check_out_lng: longitude,
    })
    .eq("id", record.id)

  if (error) {
    if (isTeacherAttendanceSetupError(error.message)) {
      return NextResponse.json({ error: SETUP_ERROR_MESSAGE }, { status: 503 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, action: "check_out", distance })
  } catch (err: any) {
    console.error("[teacher-attendance POST] Uncaught:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
