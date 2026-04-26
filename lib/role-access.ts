import { supabase } from "./supabase"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* =========================
   PARENT ACCESS
========================= */
export async function getCurrentParentStudentIds(): Promise<string[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user

    if (!user) {
      await wait(300)
      continue
    }

    console.log("[ParentAccess] Checking user:", user.id)

    // 1. Try auth_id
    const { data: byAuthId } = await supabase
      .from("parents")
      .select("student_id")
      .eq("auth_id", user.id)

    const idsByAuth = (byAuthId || [])
      .map((p) => p.student_id)
      .filter((id): id is string => Boolean(id))

    if (idsByAuth.length > 0) {
      console.log("[ParentAccess] Found via auth_id:", idsByAuth)
      return [...new Set(idsByAuth)]
    }

    // 2. Try email
    const email = user.email?.trim().toLowerCase()

    if (email) {
      const { data: byEmail } = await supabase
        .from("parents")
        .select("student_id")
        .eq("email", email)

      const idsByEmail = (byEmail || [])
        .map((p) => p.student_id)
        .filter((id): id is string => Boolean(id))

      if (idsByEmail.length > 0) {
        console.log("[ParentAccess] Found via email:", idsByEmail)

        // link auth_id automatically
        await supabase
          .from("parents")
          .update({ auth_id: user.id })
          .eq("email", email)

        return [...new Set(idsByEmail)]
      }
    }

    await wait(500)
  }

  console.warn("[ParentAccess] No student IDs found after retries")
  return []
}

/* =========================
   TEACHER ACCESS
========================= */
export async function getCurrentTeacher() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  if (!user) return null

  // Try auth_id first
  const { data: teacherByAuth } = await supabase
    .from("teachers")
    .select("id, school_id, email, name")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (teacherByAuth) return teacherByAuth

  // Fallback to email
  const email = user.email?.trim().toLowerCase()
  if (!email) return null

  const { data: teacherByEmail } = await supabase
    .from("teachers")
    .select("id, school_id, email, name")
    .eq("email", email)
    .maybeSingle()

  if (!teacherByEmail) return null

  // Link auth_id automatically
  await supabase
    .from("teachers")
    .update({ auth_id: user.id })
    .eq("id", teacherByEmail.id)

  return teacherByEmail
}

/* =========================
   TEACHER CLASS ACCESS
========================= */
export async function getCurrentTeacherClassIds(): Promise<string[]> {
  const teacher = await getCurrentTeacher()

  if (!teacher) return []

  const [
    { data: teacherClassRows, error: teacherClassError },
    { data: directClassRows, error: directClassError }
  ] = await Promise.all([
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
    ...(directClassRows || []).map((c) => c.id),
  ])]
}