import { NextResponse } from "next/server"

export const maxDuration = 60
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function truncate(value: string | null | undefined, max: number): string | null {
  if (!value) return null
  return String(value).slice(0, max) || null
}

function safeEmail(value: string | undefined | null): string | null {
  const e = String(value || "").trim().toLowerCase()
  return EMAIL_RE.test(e) ? e : null
}

// ─── students ─────────────────────────────────────────────────────────────────

async function importStudents(
  rows: string[][],
  headers: string[],
  schoolId: string,
  errors: string[]
) {
  // ── 1. Fetch supporting data in parallel ──────────────────────────────────
  const [classesResult, yearResult] = await Promise.all([
    supabaseAdmin.from("classes").select("id, name").eq("school_id", schoolId),
    supabaseAdmin
      .from("academic_years")
      .select("id")
      .eq("school_id", schoolId)
      .eq("is_active", true)
      .maybeSingle(),
  ])

  // Build class name → id map (case-insensitive)
  const classMap = new Map<string, string>()
  for (const cls of classesResult.data ?? []) {
    classMap.set(cls.name.trim().toLowerCase(), cls.id)
  }
  const yearId = yearResult.data?.id ?? null

  // ── 2. Auto-create missing classes from the CSV ───────────────────────────
  const csvClassNames = new Set<string>()
  for (const row of rows) {
    const r = mapRow(headers, row)
    const cn = (r["class"] || r["class_name"] || "").trim()
    if (cn) csvClassNames.add(cn)
  }

  const missingClasses = [...csvClassNames].filter(
    (cn) => !classMap.has(cn.toLowerCase())
  )

  if (missingClasses.length) {
    const newClasses = missingClasses.map((cn) => ({
      id: crypto.randomUUID(),
      school_id: schoolId,
      name: cn,
      capacity: 40,
    }))

    const { data: created, error: classErr } = await supabaseAdmin
      .from("classes")
      .insert(newClasses)
      .select("id, name")

    if (classErr) {
      errors.push(`Could not create classes: ${classErr.message}`)
    } else {
      for (const cls of created ?? []) {
        classMap.set(cls.name.trim().toLowerCase(), cls.id)
      }
    }
  }

  // ── 2. Build insert arrays in memory ─────────────────────────────────────
  const studentRows: object[] = []
  const enrollmentRows: object[] = []
  const parentRows: object[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row.every((c) => !c.trim())) continue

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

    const dobRaw = r["date_of_birth"] || r["dob"] || ""
    const dob = dobRaw && !isNaN(Date.parse(dobRaw)) ? dobRaw : null

    const className = (r["class"] || r["class_name"] || "").trim().toLowerCase()
    const classId = className ? (classMap.get(className) ?? null) : null

    const studentId = crypto.randomUUID()
    const studentCode = `ST${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    studentRows.push({
      id: studentId,
      school_id: schoolId,
      name: name.slice(0, 200),
      email: safeEmail(r["student_email"] || r["email"]),
      roll_number: rollNumber,
      student_type: studentType,
      father_name: truncate(r["father_name"], 200),
      mother_name: truncate(r["mother_name"], 200),
      date_of_birth: dob,
      student_code: studentCode,
      class_id: classId,
    })

    if (classId && yearId) {
      enrollmentRows.push({
        id: crypto.randomUUID(),
        student_id: studentId,
        class_id: classId,
        school_id: schoolId,
        academic_year_id: yearId,
        roll_number: rollNumber,
      })
    }

    const fatherName = truncate(r["father_name"], 200) || ""
    const motherName = truncate(r["mother_name"], 200) || ""
    const parentEmail = safeEmail(r["parent_email"]) || ""
    const parentPhone = truncate(r["parent_phone"], 20) || ""

    if (fatherName || motherName || parentEmail || parentPhone) {
      parentRows.push({
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
  }

  if (studentRows.length === 0) return 0

  // ── 3. Bulk insert in chunks of 500 ──────────────────────────────────────
  const CHUNK = 500

  const chunkInsert = async (table: string, data: object[]) => {
    for (let i = 0; i < data.length; i += CHUNK) {
      const { error } = await supabaseAdmin.from(table).insert(data.slice(i, i + CHUNK))
      if (error) errors.push(`${table} insert error: ${error.message}`)
    }
  }

  await chunkInsert("students", studentRows)

  // Run enrollments and parents in parallel after students are saved
  await Promise.all([
    enrollmentRows.length ? chunkInsert("student_enrollments", enrollmentRows) : Promise.resolve(),
    parentRows.length ? chunkInsert("parents", parentRows) : Promise.resolve(),
  ])

  return studentRows.length
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
      const name = (r["name"] || "").slice(0, 200)
      const email = safeEmail(r["email"]) || ""

      if (!name || !email) {
        errors.push(`Row ${i + 2}: Missing teacher name or valid email`)
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
