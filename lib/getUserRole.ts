import { supabase } from "./supabase"

type UserRole = "admin" | "teacher" | "parent"

type RoleRecord = {
  role: UserRole
  school_id: string
}

async function persistRole(userId: string, role: UserRole, schoolId: string) {
  await supabase.from("profiles").upsert({
    id: userId,
    role,
    school_id: schoolId,
  })

  return {
    role,
    school_id: schoolId,
  }
}

export async function getUserRole() {
  const { data: userData } = await supabase.auth.getUser()
  const user = userData?.user

  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", user.id)
    .maybeSingle<RoleRecord>()

  if (profile?.role && profile.school_id) {
    return profile
  }

  const metadataRole = user.user_metadata?.role
  const metadataSchoolId = user.user_metadata?.school_id

  if (
    (metadataRole === "admin" || metadataRole === "teacher" || metadataRole === "parent") &&
    typeof metadataSchoolId === "string" &&
    metadataSchoolId
  ) {
    return persistRole(user.id, metadataRole, metadataSchoolId)
  }

  const normalizedEmail = user.email?.trim().toLowerCase()

  if (!normalizedEmail) {
    return null
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, school_id")
    .or(`auth_id.eq.${user.id},email.ilike.${normalizedEmail}`)
    .maybeSingle()

  if (teacher?.school_id) {
    if (teacher.id) {
      await supabase
        .from("teachers")
        .update({ auth_id: user.id })
        .eq("id", teacher.id)
    }

    return persistRole(user.id, "teacher", teacher.school_id)
  }

  const { data: parent } = await supabase
    .from("parents")
    .select("student_id, school_id")
    .ilike("email", normalizedEmail)
    .maybeSingle()

  if (parent) {
    let schoolId = parent.school_id

    if (!schoolId && parent.student_id) {
      const { data: student } = await supabase
        .from("students")
        .select("school_id")
        .eq("id", parent.student_id)
        .maybeSingle()

      schoolId = student?.school_id
    }

    if (schoolId) {
      return persistRole(user.id, "parent", schoolId)
    }
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id")
    .ilike("email", normalizedEmail)
    .maybeSingle()

  if (school?.id) {
    return persistRole(user.id, "admin", school.id)
  }

  return null
}
