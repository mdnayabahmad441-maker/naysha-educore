import { supabase } from "./supabase"

export async function getCurrentParentStudentIds() {
  const { data: userData } = await supabase.auth.getUser()
  const email = userData.user?.email

  if (!email) return []

  const { data: parents, error } = await supabase
    .from("parents")
    .select("student_id,school_id")
    .eq("email", email)

  if (error) {
    console.error("Parent access error:", error)
    return []
  }

  return [...new Set((parents || []).map((parent) => parent.student_id))]
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

  if (!user.email) return null

  const { data: teacherByEmail } = await supabase
    .from("teachers")
    .select("id,school_id,email,name")
    .eq("email", user.email)
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

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id")
    .eq("school_id", teacher.school_id)
    .eq("class_teacher_id", teacher.id)

  if (error) {
    console.error("Teacher class access error:", error)
    return []
  }

  return (classes || []).map((schoolClass) => schoolClass.id)
}
