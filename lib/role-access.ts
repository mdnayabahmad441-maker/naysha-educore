import { supabase } from "./supabase"

export async function getCurrentParentStudentIds(): Promise<string[]> {
  // Fast path: read from localStorage set during login
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("student_ids")
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((id): id is string => typeof id === "string" && Boolean(id))
        }
      }
    } catch {
      // Corrupt localStorage value — fall through to Supabase
    }
  }

  // Supabase fallback: eq("auth_id") primary, eq("email") secondary
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) return []

  console.log("[getCurrentParentStudentIds] user.id:", user.id)

  const { data: byAuthId } = await supabase
    .from("parents")
    .select("student_id")
    .eq("auth_id", user.id)

  console.log("[getCurrentParentStudentIds] parentRows by auth_id:", byAuthId)

  const byAuthIds = [...new Set(
    (byAuthId || []).map((p) => p.student_id).filter((id): id is string => Boolean(id))
  )]

  if (byAuthIds.length > 0) return byAuthIds

  const email = user.email?.trim().toLowerCase()
  if (!email) return []

  const { data: byEmail } = await supabase
    .from("parents")
    .select("student_id")
    .eq("email", email)

  console.log("[getCurrentParentStudentIds] parentRows by email:", byEmail)

  return [...new Set(
    (byEmail || []).map((p) => p.student_id).filter((id): id is string => Boolean(id))
  )]
}

export async function getCurrentTeacher() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) return null

  const { data: teacherByAuth } = await supabase
    .from("teachers")
    .select("id,school_id,email,name")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (teacherByAuth) return teacherByAuth

  const email = user.email?.trim().toLowerCase()
  if (!email) return null

  const { data: teacherByEmail } = await supabase
    .from("teachers")
    .select("id,school_id,email,name")
    .eq("email", email)
    .maybeSingle()

  if (!teacherByEmail) return null

  await supabase
    .from("teachers")
    .update({ auth_id: user.id })
    .eq("id", teacherByEmail.id)

  return teacherByEmail
}

export async function getCurrentTeacherClassIds() {
  const teacher = await getCurrentTeacher()

  if (!teacher) return []

  const [{ data: teacherClassRows, error: teacherClassError }, { data: directClassRows, error: directClassError }] =
    await Promise.all([
      supabase
        .from("teacher_classes")
        .select("class_id")
        .eq("school_id", teacher.school_id)
        .eq("teacher_id", teacher.id),
      supabase
        .from("classes")
        .select("id")
        .eq("school_id", teacher.school_id)
        .eq("class_teacher_id", teacher.id),
    ])

  if (teacherClassError || directClassError) {
    console.error("Teacher class access error:", teacherClassError || directClassError)
  }

  return [...new Set([
    ...(teacherClassRows || []).map((row) => row.class_id),
    ...(directClassRows || []).map((schoolClass) => schoolClass.id),
  ])]
}
