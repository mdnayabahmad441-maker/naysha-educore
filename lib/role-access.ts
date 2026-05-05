import { supabase } from "./supabase"

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* =========================
   PARENT ACCESS
========================= */
export async function getCurrentParentStudentIds(): Promise<string[]> {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user

  console.log("🔍 USER:", user)

  if (!user) return []

  const email = user.email?.trim().toLowerCase()
  console.log("🔍 EMAIL:", email)

  // check auth_id
  const { data: byAuth } = await supabase
    .from("parents")
    .select("*")
    .eq("auth_id", user.id)

  console.log("🔍 BY AUTH:", byAuth)

  // check email
  const { data: byEmail } = await supabase
    .from("parents")
    .select("*")
    .eq("email", email)

  console.log("🔍 BY EMAIL:", byEmail)

  const rows = (byAuth && byAuth.length > 0) ? byAuth : byEmail

  if (!rows || rows.length === 0) {
    console.log("❌ NO PARENT FOUND")
    return []
  }

  const ids = rows
    .map((r) => r.student_id)
    .filter((id): id is string => Boolean(id))

  console.log("✅ STUDENT IDS:", ids)

  return ids
}

/* =========================
   TEACHER ACCESS - FIXED
========================= */
export async function getCurrentTeacher() {
  try {
    // First check if we have a session
    const { data: sessionData } = await supabase.auth.getSession()
    const session = sessionData.session
    
    if (!session) {
      console.log("❌ No active session")
      return null
    }

    const user = session.user
    console.log("🔍 Current user:", user?.email)

    if (!user) return null

    // Try auth_id first (most reliable)
    const { data: teacherByAuth, error: authError } = await supabase
      .from("teachers")
      .select("id, school_id, email, name, auth_id")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (!authError && teacherByAuth) {
      console.log("✅ Teacher found by auth_id:", teacherByAuth.email)
      return teacherByAuth
    }

    // Fallback to email
    const email = user.email?.trim().toLowerCase()
    if (!email) {
      console.log("❌ No email found")
      return null
    }

    const { data: teacherByEmail, error: emailError } = await supabase
      .from("teachers")
      .select("id, school_id, email, name, auth_id")
      .eq("email", email)
      .maybeSingle()

    if (emailError) {
      console.error("Email lookup error:", emailError)
    }

    if (teacherByEmail) {
      console.log("✅ Teacher found by email:", teacherByEmail.email)
      
      // Link auth_id automatically if not already linked
      if (!teacherByEmail.auth_id) {
        const { error: updateError } = await supabase
          .from("teachers")
          .update({ auth_id: user.id })
          .eq("id", teacherByEmail.id)

        if (updateError) {
          console.error("Failed to link auth_id:", updateError)
        } else {
          console.log("✅ Linked auth_id to teacher")
        }
      }
      
      return teacherByEmail
    }

    console.log("❌ No teacher found for email:", email)
    return null
  } catch (error) {
    console.error("Error in getCurrentTeacher:", error)
    return null
  }
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
