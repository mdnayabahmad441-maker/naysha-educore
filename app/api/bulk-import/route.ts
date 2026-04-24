import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { requireAdminProfile } from "@/lib/api-auth"

type ImportRequest = {
  type: "students" | "teachers" | "classes"
  data: string[][]
}

export async function POST(req: Request) {
  const authResult = await requireAdminProfile(req)

  if ("response" in authResult) {
    return authResult.response
  }

  try {
    const body: ImportRequest = await req.json()
    const { type, data } = body
    const schoolId = authResult.profile.schoolId

    if (!type || !data || !schoolId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let imported = 0
    const errors: string[] = []

    const headers = data[0] || []
    const rows = data.slice(1)

    if (type === "students") {
      imported = await importStudents(rows, headers, schoolId, errors)
    } else if (type === "teachers") {
      imported = await importTeachers(rows, headers, schoolId, errors)
    } else if (type === "classes") {
      imported = await importClasses(rows, headers, schoolId, errors)
    }

    return NextResponse.json({
      success: imported > 0,
      imported,
      errors: errors.slice(0, 5),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function importStudents(rows: string[][], headers: string[], schoolId: string, errors: string[]) {
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      const record: Record<string, any> = {}

      headers.forEach((header, index) => {
        const value = row[index]?.trim() || ""
        const lowerHeader = header.toLowerCase().replace(/\s+/g, "_")

        if (lowerHeader === "name") record.name = value
        if (lowerHeader === "roll_number" || lowerHeader === "roll number") record.roll_number = parseInt(value) || null
        if (lowerHeader === "class") record.class_name = value
        if (lowerHeader === "email") record.email = value
        if (lowerHeader === "phone") record.phone = value
        if (lowerHeader === "father_name" || lowerHeader === "father name") record.father_name = value
        if (lowerHeader === "mother_name" || lowerHeader === "mother name") record.mother_name = value
        if (lowerHeader === "address") record.address = value
        if (lowerHeader === "dob" || lowerHeader === "date_of_birth") record.date_of_birth = value
      })

      if (!record.name) {
        errors.push(`Row ${i + 1}: Missing student name`)
        continue
      }

      let classId = null
      if (record.class_name) {
        const { data: cls } = await supabaseAdmin
          .from("classes")
          .select("id")
          .eq("school_id", schoolId)
          .ilike("name", record.class_name)
          .maybeSingle()

        classId = cls?.id
      }

      const studentId = crypto.randomUUID()
      const studentCode = `ST${Date.now()}${Math.random().toString(36).slice(2, 8)}`

      const { error } = await supabaseAdmin.from("students").insert({
        id: studentId,
        school_id: schoolId,
        name: record.name,
        email: record.email || null,
        phone: record.phone || null,
        father_name: record.father_name || null,
        mother_name: record.mother_name || null,
        address: record.address || null,
        date_of_birth: record.date_of_birth || null,
        student_code: studentCode,
        class_id: classId,
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      } else {
        imported++

        if (classId && record.roll_number) {
          const { data: year } = await supabaseAdmin
            .from("academic_years")
            .select("id")
            .eq("school_id", schoolId)
            .eq("is_active", true)
            .maybeSingle()

          if (year) {
            await supabaseAdmin.from("student_enrollments").insert({
              id: crypto.randomUUID(),
              student_id: studentId,
              class_id: classId,
              school_id: schoolId,
              academic_year_id: year.id,
              roll_number: record.roll_number,
            })
          }
        }
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }

  return imported
}

async function importTeachers(rows: string[][], headers: string[], schoolId: string, errors: string[]) {
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      const record: Record<string, any> = {}

      headers.forEach((header, index) => {
        const value = row[index]?.trim() || ""
        const lowerHeader = header.toLowerCase().replace(/\s+/g, "_")

        if (lowerHeader === "name") record.name = value
        if (lowerHeader === "email") record.email = value
        if (lowerHeader === "phone") record.phone = value
        if (lowerHeader === "subject") record.subject = value
        if (lowerHeader === "qualification") record.qualification = value
        if (lowerHeader === "experience_years" || lowerHeader === "experience years") record.experience_years = parseInt(value) || 0
      })

      if (!record.name || !record.email) {
        errors.push(`Row ${i + 1}: Missing teacher name or email`)
        continue
      }

      const normalizedEmail = record.email.toLowerCase().trim()

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      })

      if (authError || !authData?.user?.id) {
        errors.push(`Row ${i + 1}: ${authError?.message || "Auth user not created"}`)
        continue
      }

      const { error } = await supabaseAdmin.from("teachers").insert({
        id: crypto.randomUUID(),
        auth_id: authData.user.id,
        school_id: schoolId,
        name: record.name,
        email: normalizedEmail,
        phone: record.phone || null,
        subject: record.subject || null,
        qualification: record.qualification || null,
        experience_years: record.experience_years || 0,
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      } else {
        imported++
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }

  return imported
}

async function importClasses(rows: string[][], headers: string[], schoolId: string, errors: string[]) {
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i]
      const record: Record<string, any> = {}

      headers.forEach((header, index) => {
        const value = row[index]?.trim() || ""
        const lowerHeader = header.toLowerCase().replace(/\s+/g, "_")

        if (lowerHeader === "name") record.name = value
        if (lowerHeader === "capacity") record.capacity = parseInt(value) || 40
        if (lowerHeader === "teacher_name" || lowerHeader === "teacher name") record.teacher_name = value
      })

      if (!record.name) {
        errors.push(`Row ${i + 1}: Missing class name`)
        continue
      }

      let teacherId = null

      if (record.teacher_name) {
        const { data: teacher } = await supabaseAdmin
          .from("teachers")
          .select("id")
          .eq("school_id", schoolId)
          .ilike("name", record.teacher_name)
          .maybeSingle()

        teacherId = teacher?.id
      }

      const { error } = await supabaseAdmin.from("classes").insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        name: record.name,
        capacity: record.capacity,
        class_teacher_id: teacherId || null,
      })

      if (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      } else {
        imported++
      }
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message}`)
    }
  }

  return imported
}
