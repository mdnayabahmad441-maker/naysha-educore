import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminProfile } from "@/lib/api-auth"

type ImportRequest = {
  type: "students" | "teachers" | "classes"
  data: string[][]
}

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)
  if ("response" in authResult) return authResult.response

  try {
    const body: ImportRequest = await req.json()
    const { type, data } = body
    const schoolId = authResult.profile.schoolId

    if (!type || !data || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let imported = 0
    const errors: string[] = []

    const headers = data[0] ?? []
    const rows = data.slice(1)

    if (type === "students") {
      imported = await importStudents(rows, headers, schoolId, errors)
    } else if (type === "teachers") {
      imported = await importTeachers(rows, headers, schoolId, errors)
    } else if (type === "classes") {
      imported = await importClasses(rows, headers, schoolId, errors)
    }

    return NextResponse.json({ success: imported > 0, imported, errors: errors.slice(0, 10) })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function mapRow(headers: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((h, i) => {
    const key = h.trim().toLowerCase().replace(/\s+/g, "_")
    out[key] = (row[i] ?? "").trim()
  })
  return out
}

const VALID_STUDENT_TYPES = ["day_scholar", "day_scholar_transport", "hosteler"]

// ─── students ─────────────────────────────────────────────────────────────────

async function importStudents(
  rows: string[][],
  headers: string[],
  schoolId: string,
  errors: string[]
) {
  let imported = 0

  // Fetch active academic year once
  const { data: year } = await supabaseAdmin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle()

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((c) => !c.trim())) continue // skip blank rows

    try {
      const r = mapRow(headers, row)

      const name = r["name"] || r["student_name"] || ""
      if (!name) {
        errors.push(`Row ${i + 2}: Missing student name`)
        continue
      }

      const rollRaw = r["roll_number"] || r["roll"] || ""
      const rollNumber = rollRaw ? parseInt(rollRaw) || null : null

      const rawType = r["student_type"] || r["type"] || "day_scholar"
      const studentType = VALID_STUDENT_TYPES.includes(rawType) ? rawType : "day_scholar"

      const dob = r["date_of_birth"] || r["dob"] || ""

      // Resolve class
      const className = r["class"] || r["class_name"] || ""
      let classId: string | null = null
      if (className) {
        const { data: cls } = await supabaseAdmin
          .from("classes")
          .select("id")
          .eq("school_id", schoolId)
          .ilike("name", className)
          .maybeSingle()
        classId = cls?.id ?? null
      }

      const studentId = crypto.randomUUID()
      const studentCode = `ST${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

      const { error: studentErr } = await supabaseAdmin.from("students").insert({
        id: studentId,
        school_id: schoolId,
        name,
        email: r["student_email"] || r["email"] || null,
        roll_number: rollNumber,
        student_type: studentType,
        father_name: r["father_name"] || null,
        mother_name: r["mother_name"] || null,
        address: r["address"] || null,
        date_of_birth: dob || null,
        student_code: studentCode,
        class_id: classId,
      })

      if (studentErr) {
        errors.push(`Row ${i + 2}: ${studentErr.message}`)
        continue
      }

      imported++

      // Enrollment — create whenever class is found
      if (classId && year) {
        await supabaseAdmin.from("student_enrollments").insert({
          id: crypto.randomUUID(),
          student_id: studentId,
          class_id: classId,
          school_id: schoolId,
          academic_year_id: year.id,
          roll_number: rollNumber,
        })
      }

      // Parent record — create when any parent field is present
      const fatherName = r["father_name"] || ""
      const motherName = r["mother_name"] || ""
      const parentEmail = r["parent_email"] || ""
      const parentPhone = r["parent_phone"] || ""

      if (fatherName || motherName || parentEmail || parentPhone) {
        await supabaseAdmin.from("parents").insert({
          id: crypto.randomUUID(),
          school_id: schoolId,
          student_id: studentId,
          name: fatherName || motherName || null,
          father_name: fatherName || null,
          mother_name: motherName || null,
          email: parentEmail || null,
          phone: parentPhone || null,
        })
      }
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`)
    }
  }

  return imported
}

// ─── teachers ─────────────────────────────────────────────────────────────────

async function importTeachers(
  rows: string[][],
  headers: string[],
  schoolId: string,
  errors: string[]
) {
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((c) => !c.trim())) continue

    try {
      const r = mapRow(headers, row)
      const name = r["name"] || ""
      const email = (r["email"] || "").toLowerCase()

      if (!name || !email) {
        errors.push(`Row ${i + 2}: Missing teacher name or email`)
        continue
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
      })

      if (authError || !authData?.user?.id) {
        errors.push(`Row ${i + 2}: ${authError?.message || "Auth user not created"}`)
        continue
      }

      const { error } = await supabaseAdmin.from("teachers").insert({
        id: crypto.randomUUID(),
        auth_id: authData.user.id,
        school_id: schoolId,
        name,
        email,
        phone: r["phone"] || null,
        subject: r["subject"] || null,
        qualification: r["qualification"] || null,
        experience_years: parseInt(r["experience_years"] || "0") || 0,
      })

      if (error) {
        errors.push(`Row ${i + 2}: ${error.message}`)
      } else {
        imported++
      }
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`)
    }
  }

  return imported
}

// ─── classes ──────────────────────────────────────────────────────────────────

async function importClasses(
  rows: string[][],
  headers: string[],
  schoolId: string,
  errors: string[]
) {
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((c) => !c.trim())) continue

    try {
      const r = mapRow(headers, row)
      const name = r["name"] || ""

      if (!name) {
        errors.push(`Row ${i + 2}: Missing class name`)
        continue
      }

      let teacherId: string | null = null
      if (r["teacher_name"]) {
        const { data: teacher } = await supabaseAdmin
          .from("teachers")
          .select("id")
          .eq("school_id", schoolId)
          .ilike("name", r["teacher_name"])
          .maybeSingle()
        teacherId = teacher?.id ?? null
      }

      const { error } = await supabaseAdmin.from("classes").insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        name,
        capacity: parseInt(r["capacity"] || "40") || 40,
        class_teacher_id: teacherId,
      })

      if (error) {
        errors.push(`Row ${i + 2}: ${error.message}`)
      } else {
        imported++
      }
    } catch (err: any) {
      errors.push(`Row ${i + 2}: ${err.message}`)
    }
  }

  return imported
}
