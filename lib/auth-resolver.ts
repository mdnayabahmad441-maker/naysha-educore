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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{4,50}$/

async function findSchoolSubdomain(schoolId: string) {
  const { data } = await supabaseAdmin
    .from("schools")
    .select("subdomain, domain")
    .eq("id", schoolId)
    .maybeSingle()

  return (data?.subdomain || data?.domain || null) as string | null
}

async function resolveParentRows(userId: string, email: string): Promise<ParentRow[]> {
  console.log("[resolveParentRows] Looking up user.id:", userId, "email:", email)

  const { data: byAuthId, error: byAuthError } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("auth_id", userId)

  if (byAuthError) {
    throw new Error(byAuthError.message)
  }

  const authRows = (byAuthId || []) as ParentRow[]
  console.log("[resolveParentRows] Rows by auth_id:", authRows)

  if (authRows.length > 0) {
    return authRows
  }

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("email", email)

  if (byEmailError) {
    throw new Error(byEmailError.message)
  }

  const emailRows = (byEmail || []) as ParentRow[]
  console.log("[resolveParentRows] Rows by email:", emailRows)

  return emailRows
}

async function resolveParentSchool(parentRows: ParentRow[]) {
  const directSchoolId =
    parentRows.map((row) => row.school_id).find((schoolId): schoolId is string => Boolean(schoolId)) || null

  if (directSchoolId) {
    return directSchoolId
  }

  const studentIds = [...new Set(
    parentRows.map((row) => row.student_id).filter((studentId): studentId is string => Boolean(studentId))
  )]

  if (studentIds.length === 0) {
    return null
  }

  const { data: students, error } = await supabaseAdmin
    .from("students")
    .select("id, school_id")
    .in("id", studentIds)

  if (error) {
    throw new Error(error.message)
  }

  return (
    (students || [])
      .map((student) => student.school_id)
      .find((schoolId): schoolId is string => Boolean(schoolId)) || null
  )
}

export function isEmailIdentifier(identifier: string) {
  return EMAIL_PATTERN.test(identifier.trim().toLowerCase())
}

export function isUsernameIdentifier(identifier: string) {
  return USERNAME_PATTERN.test(identifier.trim().toLowerCase())
}

export async function resolveUsernameToEmail(identifier: string) {
  const normalizedUsername = identifier.trim().toLowerCase()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    })

    if (error) {
      throw new Error("Lookup failed")
    }

    const matchedUser = data.users.find((user) => {
      const username = String(user.user_metadata?.username || "").trim().toLowerCase()
      return username === normalizedUsername
    })

    if (matchedUser?.email) {
      return matchedUser.email.toLowerCase()
    }

    if (data.users.length < 200) {
      break
    }

    page += 1
  }

  return null
}

export async function resolveAccountByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase()

  const [{ data: teacher }, { data: school }, { data: parents }] = await Promise.all([
    supabaseAdmin
      .from("teachers")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("schools")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("parents")
      .select("id")
      .eq("email", normalizedEmail)
      .limit(1),
  ])

  if ((parents || []).length > 0) {
    return {
      email: normalizedEmail,
      role: "parent" as const,
      loginMethod: "otp" as const,
    }
  }

  if (teacher?.id) {
    return {
      email: normalizedEmail,
      role: "teacher" as const,
      loginMethod: "password" as const,
    }
  }

  if (school?.id) {
    return {
      email: normalizedEmail,
      role: "admin" as const,
      loginMethod: "password" as const,
    }
  }

  return null
}

export async function resolveIdentifierToAccount(identifier: string): Promise<ResolvedAccount | null> {
  const normalizedIdentifier = identifier.trim().toLowerCase()

  if (!normalizedIdentifier) {
    return null
  }

  if (isEmailIdentifier(normalizedIdentifier)) {
    return resolveAccountByEmail(normalizedIdentifier)
  }

  if (!isUsernameIdentifier(normalizedIdentifier)) {
    return null
  }

  const email = await resolveUsernameToEmail(normalizedIdentifier)

  if (!email) {
    return null
  }

  return resolveAccountByEmail(email)
}

async function persistResolvedAccess(user: User, access: ResolvedUserAccess) {
  const metadata = user.user_metadata || {}

  const upsertPayload: Record<string, unknown> = {
    id: access.userId,
    role: access.role,
  }

  if (access.schoolId) {
    upsertPayload.school_id = access.schoolId
  }

  await Promise.all([
    supabaseAdmin.from("profiles").upsert(upsertPayload),
    supabaseAdmin.auth.admin.updateUserById(access.userId, {
      user_metadata: {
        ...metadata,
        ...(access.schoolId ? { school_id: access.schoolId } : {}),
        role: access.role,
        active_role: access.role,
      },
    }),
  ])
}

export async function resolveUserAccess(user: User, preferredRole?: AccountRole | null) {
  const email = String(user.email || "").trim().toLowerCase()

  if (!email) {
    throw new Error("Email missing on authenticated user")
  }

  console.log("[resolveUserAccess] user.id:", user.id, "email:", email, "preferredRole:", preferredRole)

  const effectivePreferredRole = preferredRole

  const allowParent = effectivePreferredRole === "parent"
  const allowTeacher = effectivePreferredRole === "teacher"
  const allowAdmin = effectivePreferredRole === "admin"
  // ── PARENT ──────────────────────────────────────────────────────────────────
  if (allowParent) {
    const parentRows = await resolveParentRows(user.id, email)

    if (parentRows.length > 0) {
      // Link auth_id so future lookups hit the faster eq("auth_id") path
      await supabaseAdmin
        .from("parents")
        .update({ auth_id: user.id })
        .eq("email", email)

      const studentIds = [...new Set(
        parentRows.map((row) => row.student_id).filter((id): id is string => Boolean(id))
      )]

      console.log("[resolveUserAccess] parent studentIds:", studentIds)

      const schoolId =
        (await resolveParentSchool(parentRows)) ||
        (typeof user.user_metadata?.school_id === "string" && user.user_metadata.school_id
          ? user.user_metadata.school_id
          : null)

      if (!schoolId) {
        await Promise.all([
          supabaseAdmin.from("profiles").upsert({ id: user.id, role: "parent" }),
          supabaseAdmin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata || {}),
              role: "parent",
              active_role: "parent",
            },
          }),
        ])

        return {
          userId: user.id,
          email,
          role: "parent" as AccountRole,
          schoolId: "",
          subdomain: "",
          next: "/parent" as const,
          studentIds,
          school_id: "",
        }
      }

      const subdomain = await findSchoolSubdomain(schoolId)

      if (!subdomain) {
        throw new Error("School configuration missing — contact your school admin")
      }

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "parent",
        schoolId,
        subdomain,
        next: "/parent",
        studentIds,
        school_id: schoolId,
      }

      await Promise.all([
        persistResolvedAccess(user, access),
        supabaseAdmin
          .from("parents")
          .update({ auth_id: user.id, school_id: schoolId })
          .eq("email", email),
      ])

      return access
    }

    if (effectivePreferredRole === "parent") {
      return null
    }
  }

  // ── TEACHER ──────────────────────────────────────────────────────────────────
  if (allowTeacher) {
    const { data: teacherByAuth } = await supabaseAdmin
      .from("teachers")
      .select("id, school_id")
      .eq("auth_id", user.id)
      .maybeSingle()

    const teacher = teacherByAuth || (
      await supabaseAdmin
        .from("teachers")
        .select("id, school_id")
        .eq("email", email)
        .maybeSingle()
    ).data

    if (teacher?.school_id) {
      const subdomain = await findSchoolSubdomain(teacher.school_id)

      if (!subdomain) {
        throw new Error("School not found")
      }

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "teacher",
        schoolId: teacher.school_id,
        subdomain,
        next: "/teacher",
        studentIds: [],
        school_id: teacher.school_id,
      }

      await Promise.all([
        persistResolvedAccess(user, access),
        teacher.id
          ? supabaseAdmin
              .from("teachers")
              .update({ auth_id: user.id })
              .eq("id", teacher.id)
          : Promise.resolve(),
      ])

      return access
    }

    if (effectivePreferredRole === "teacher") {
      return null
    }
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────────
  if (!allowAdmin) {
    return null
  }

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id, subdomain, domain")
    .eq("email", email)
    .maybeSingle()

  const subdomain = school?.subdomain || school?.domain || null

  if (!school?.id || !subdomain) {
    return null
  }

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
