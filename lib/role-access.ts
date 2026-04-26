import { supabase } from "./supabase"

export async function getCurrentParentStudentIds() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  const email = user?.email?.trim().toLowerCase()

  if (!user || !email) return []

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (accessToken) {
    try {
      const response = await fetch("/api/auth/parent-context", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const result = await response.json()

        if (Array.isArray(result.studentIds)) {
          return result.studentIds
        }
      }
    } catch (error) {
      console.error("Parent context access error:", error)
    }
  }

  const { data: linkedParents, error: linkedError } = await supabase
    .from("parents")
    .select("student_id,school_id")
    .eq("auth_id", user.id)

  if (linkedError) {
    console.error("Parent linked access error:", linkedError)
  }

  const linkedStudentIds = [...new Set(((linkedParents || []).map((parent) => parent.student_id)).filter(Boolean))]

  if (linkedStudentIds.length > 0) {
    return linkedStudentIds
  }

  const { data: parents, error } = await supabase
    .from("parents")
    .select("id, student_id, school_id")
    .ilike("email", email)

  if (error) {
    console.error("Parent access error:", error)
    return []
  }

  const parentRows = parents || []
  const studentIds = [...new Set(parentRows.map((parent) => parent.student_id).filter(Boolean))]
  const schoolId = parentRows.map((parent) => parent.school_id).find(Boolean) || null

  if (parentRows.length > 0) {
    const updatePayload = schoolId ? { auth_id: user.id, school_id: schoolId } : { auth_id: user.id }

    await supabase
      .from("parents")
      .update(updatePayload)
      .ilike("email", email)
  }

  return studentIds
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
    .ilike("email", email)
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
