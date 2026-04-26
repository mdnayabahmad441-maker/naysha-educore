import { supabase } from "./supabase"

type UserRole = "admin" | "teacher" | "parent"

type RoleRecord = {
  role: UserRole
  school_id: string
}

type ParentRoleRecord = {
  id: string
  student_id: string | null
  school_id: string | null
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

async function resolveParentSchoolId(userId: string, normalizedEmail: string) {
  // Two separate queries to avoid .or() RLS issues when auth_id is null on first login
  const { data: byAuthId } = await supabase
    .from("parents")
    .select("id, student_id, school_id")
    .eq("auth_id", userId)

  let parentRows = (byAuthId as ParentRoleRecord[] | null) || []

  if (parentRows.length === 0) {
    const { data: byEmail } = await supabase
      .from("parents")
      .select("id, student_id, school_id")
      .ilike("email", normalizedEmail)
    parentRows = (byEmail as ParentRoleRecord[] | null) || []
  }

  if (parentRows.length === 0) {
    return null
  }

  const schoolIds = parentRows
    .map((parent) => parent.school_id)
    .filter((schoolId): schoolId is string => Boolean(schoolId))

  if (schoolIds.length > 0) {
    await supabase
      .from("parents")
      .update({ auth_id: userId })
      .ilike("email", normalizedEmail)

    return schoolIds[0]
  }

  const studentIds = parentRows
    .map((parent) => parent.student_id)
    .filter((studentId): studentId is string => Boolean(studentId))

  if (studentIds.length === 0) {
    return null
  }

  const { data: students } = await supabase
    .from("students")
    .select("id, school_id")
    .in("id", studentIds)

  const schoolId = ((students as Array<{ id: string; school_id: string | null }> | null) || [])
    .map((student) => student.school_id)
    .find((value): value is string => Boolean(value))

  if (!schoolId) {
    return null
  }

  await supabase
    .from("parents")
    .update({ auth_id: userId, school_id: schoolId })
    .ilike("email", normalizedEmail)

  return schoolId
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

  const { data: teacherByAuthId } = await supabase
    .from("teachers")
    .select("id, school_id")
    .eq("auth_id", user.id)
    .maybeSingle()

  let teacher = teacherByAuthId

  if (!teacher) {
    const { data: teacherByEmail } = await supabase
      .from("teachers")
      .select("id, school_id")
      .ilike("email", normalizedEmail)
      .maybeSingle()
    teacher = teacherByEmail
  }

  if (teacher?.school_id) {
    if (teacher.id) {
      await supabase
        .from("teachers")
        .update({ auth_id: user.id })
        .eq("id", teacher.id)
    }

    return persistRole(user.id, "teacher", teacher.school_id)
  }

  const parentSchoolId = await resolveParentSchoolId(user.id, normalizedEmail)

  if (parentSchoolId) {
    return persistRole(user.id, "parent", parentSchoolId)
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
