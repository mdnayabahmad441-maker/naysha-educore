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

async function resolveParentRows(userId: string, email: string) {
  const { data: byAuthId, error: byAuthError } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("auth_id", userId)

  if (byAuthError) {
    throw new Error(byAuthError.message)
  }

  const authRows = (byAuthId || []) as ParentRow[]

  if (authRows.length > 0) {
    return authRows
  }

  const { data: byEmail, error: byEmailError } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .ilike("email", email)

  if (byEmailError) {
    throw new Error(byEmailError.message)
  }

  return (byEmail || []) as ParentRow[]
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
      .ilike("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("schools")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle(),
    supabaseAdmin
      .from("parents")
      .select("id")
      .ilike("email", normalizedEmail)
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

  await Promise.all([
    supabaseAdmin
      .from("profiles")
      .upsert({
        id: access.userId,
        school_id: access.schoolId,
        role: access.role,
      }),
    supabaseAdmin.auth.admin.updateUserById(access.userId, {
      user_metadata: {
        ...metadata,
        school_id: access.schoolId,
        role: access.role,
      },
    }),
  ])
}

export async function resolveUserAccess(user: User, preferredRole?: AccountRole | null) {
  const email = String(user.email || "").trim().toLowerCase()

  if (!email) {
    throw new Error("Email missing on authenticated user")
  }

  const allowParent = !preferredRole || preferredRole === "parent"
  const allowTeacher = !preferredRole || preferredRole === "teacher"
  const allowAdmin = !preferredRole || preferredRole === "admin"

  if (allowParent) {
    const parentRows = await resolveParentRows(user.id, email)

    if (parentRows.length > 0) {
      const schoolId =
        (await resolveParentSchool(parentRows)) ||
        (typeof user.user_metadata?.school_id === "string" ? user.user_metadata.school_id : null)

      if (!schoolId) {
        throw new Error("Parent linked school not found")
      }

      const subdomain = await findSchoolSubdomain(schoolId)

      if (!subdomain) {
        throw new Error("School not found")
      }

      const studentIds = [...new Set(
        parentRows.map((row) => row.student_id).filter((studentId): studentId is string => Boolean(studentId))
      )]

      const access: ResolvedUserAccess = {
        userId: user.id,
        email,
        role: "parent",
        schoolId,
        subdomain,
        next: "/parent",
        studentIds,
      }

      await Promise.all([
        persistResolvedAccess(user, access),
        supabaseAdmin
          .from("parents")
          .update({ auth_id: user.id, school_id: schoolId })
          .ilike("email", email),
      ])

      return access
    }

    if (preferredRole === "parent") {
      return null
    }
  }

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
        .ilike("email", email)
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

    if (preferredRole === "teacher") {
      return null
    }
  }

  if (!allowAdmin) {
    return null
  }

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id, subdomain, domain")
    .ilike("email", email)
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
  }

  await persistResolvedAccess(user, access)

  return access
}
