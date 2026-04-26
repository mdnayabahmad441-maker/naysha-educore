import { User } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

export type AccountRole = "admin" | "teacher" | "parent"
export type LoginMethod = "password" | "otp"

export type ResolvedAccount = {
  email: string
  role: AccountRole
  loginMethod: LoginMethod
}

export type ResolvedUserAccess = {
  userId: string
  email: string
  role: AccountRole
  schoolId: string
  subdomain: string
  next: "/admin" | "/teacher" | "/parent"
  studentIds: string[]
  school_id: string
}

type ParentRow = {
  id: string
  student_id: string | null
  school_id: string | null
}

async function findSchoolSubdomain(schoolId: string) {
  const { data } = await supabaseAdmin
    .from("schools")
    .select("subdomain, domain")
    .eq("id", schoolId)
    .maybeSingle()

  return (data?.subdomain || data?.domain || null) as string | null
}

async function resolveParentRows(userId: string, email: string): Promise<ParentRow[]> {
  const { data: byAuthId } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("auth_id", userId)

  if (byAuthId && byAuthId.length > 0) {
    return byAuthId
  }

  const { data: byEmail } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("email", email)

  return byEmail || []
}

async function resolveParentSchool(parentRows: ParentRow[]) {
  const direct =
    parentRows.map((r) => r.school_id).find(Boolean) || null

  if (direct) return direct

  const studentIds = parentRows
    .map((r) => r.student_id)
    .filter((id): id is string => Boolean(id))

  if (studentIds.length === 0) return null

  const { data } = await supabaseAdmin
    .from("students")
    .select("school_id")
    .in("id", studentIds)

  return (data || []).map((s) => s.school_id).find(Boolean) || null
}

async function persistResolvedAccess(user: User, access: ResolvedUserAccess) {
  await Promise.all([
    supabaseAdmin.from("profiles").upsert({
      id: access.userId,
      role: access.role,
      school_id: access.schoolId,
    }),
    supabaseAdmin.auth.admin.updateUserById(access.userId, {
      user_metadata: {
        ...(user.user_metadata || {}),
        role: access.role,
        school_id: access.schoolId,
        active_role: access.role,
      },
    }),
  ])
}

export async function resolveUserAccess(user: User, preferredRole?: AccountRole | null) {
  const email = String(user.email || "").trim().toLowerCase()

  if (!email) {
    throw new Error("Email missing")
  }

  console.log("RESOLVER →", { email, preferredRole })

  // ✅ FIXED LOGIC
  const allowParent = preferredRole === "parent" || !preferredRole
  const allowTeacher = preferredRole === "teacher" || !preferredRole
  const allowAdmin = preferredRole === "admin" || !preferredRole

  // =========================
  // ✅ PARENT (FIRST PRIORITY)
  // =========================
  if (allowParent) {
    const parentRows = await resolveParentRows(user.id, email)

    if (parentRows.length > 0) {
      const studentIds = [...new Set(
        parentRows.map((r) => r.student_id).filter((id): id is string => Boolean(id))
      )]

      const schoolId =
        (await resolveParentSchool(parentRows)) ||
        user.user_metadata?.school_id ||
        ""

      const subdomain = schoolId ? await findSchoolSubdomain(schoolId) : ""

      await supabaseAdmin
        .from("parents")
        .update({ auth_id: user.id, school_id: schoolId })
        .eq("email", email)

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "parent",
        schoolId: schoolId || "",
        subdomain: subdomain || "",
        next: "/parent",
        studentIds,
        school_id: schoolId || "",
      }

      await persistResolvedAccess(user, access)

      return access
    }
  }

  // =========================
  // TEACHER
  // =========================
  if (allowTeacher) {
    const { data: teacher } = await supabaseAdmin
      .from("teachers")
      .select("id, school_id")
      .eq("email", email)
      .maybeSingle()

    if (teacher?.school_id) {
      const subdomain = await findSchoolSubdomain(teacher.school_id)

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "teacher",
        schoolId: teacher.school_id,
        subdomain: subdomain || "",
        next: "/teacher",
        studentIds: [],
        school_id: teacher.school_id,
      }

      await persistResolvedAccess(user, access)

      return access
    }
  }

  // =========================
  // ADMIN (LAST)
  // =========================
  if (allowAdmin) {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id, subdomain, domain")
      .eq("email", email)
      .maybeSingle()

    if (school?.id) {
      const subdomain = school.subdomain || school.domain || ""

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "admin",
        schoolId: school.id,
        subdomain,
        next: "/admin",
        studentIds: [],
        school_id: school.id,
      }

      await persistResolvedAccess(user, access)

      return access
    }
  }

  return null
}
// ✅ REQUIRED FOR LOGIN FLOW (DO NOT REMOVE)
export async function resolveIdentifierToAccount(identifier: string) {
  const email = identifier.trim().toLowerCase()

  if (!email) return null

  // Check parent first
  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", email)
    .limit(1)

  if ((parent || []).length > 0) {
    return {
      email,
      role: "parent" as const,
      loginMethod: "otp" as const,
    }
  }

  // Check teacher
  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (teacher?.id) {
    return {
      email,
      role: "teacher" as const,
      loginMethod: "password" as const,
    }
  }

  // Check admin
  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (school?.id) {
    return {
      email,
      role: "admin" as const,
      loginMethod: "password" as const,
    }
  }

  return null
}
// ✅ REQUIRED FOR OTP FLOW
export async function resolveAccountByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail) return null

  // Check parent
  const { data: parents } = await supabaseAdmin
    .from("parents")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1)

  if ((parents || []).length > 0) {
    return {
      email: normalizedEmail,
      role: "parent" as const,
      loginMethod: "otp" as const,
    }
  }

  // Check teacher
  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (teacher?.id) {
    return {
      email: normalizedEmail,
      role: "teacher" as const,
      loginMethod: "password" as const,
    }
  }

  // Check admin
  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle()

  if (school?.id) {
    return {
      email: normalizedEmail,
      role: "admin" as const,
      loginMethod: "password" as const,
    }
  }

  return null
}