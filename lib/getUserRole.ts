import { supabase } from "./supabase"
import { isSuperAdminEmail } from "./super-admin"

type UserRole = "admin" | "teacher" | "parent" | "super_admin"

export type AuthSessionContext = {
  userId: string
  email: string
  role: UserRole
  schoolId: string
  subdomain: string
  next: "/admin" | "/teacher" | "/parent" | "/super-admin"
  studentIds: string[]
  school_id: string
}

export async function getAuthSessionContext(): Promise<AuthSessionContext | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  const sessionUser = sessionData.session?.user || null

  if (!accessToken) {
    return buildFallbackContext(sessionUser)
  }

  try {
    const response = await fetch("/api/auth/session", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (response.ok) {
      const data = await response.json()

      if (data?.role && (data?.schoolId || data.role === "super_admin")) {
        return {
          userId: String(data.userId),
          email: String(data.email || ""),
          role: data.role as UserRole,
          schoolId: String(data.schoolId),
          subdomain: String(data.subdomain || ""),
          next: data.next as "/admin" | "/teacher" | "/parent" | "/super-admin",
          studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
          school_id: String(data.schoolId),
        }
      }
    }
  } catch (error) {
    console.error("Session context fetch failed:", error)
  }

  return buildFallbackContext(sessionUser)
}

async function buildFallbackContext(user: any): Promise<AuthSessionContext | null> {
  if (!user) {
    return null
  }

  const email = String(user.email || "").trim().toLowerCase()
  const metadataRole = user.user_metadata?.role
  const metadataActiveRole = user.user_metadata?.active_role
  const metadataSchoolId =
    typeof user.user_metadata?.school_id === "string" ? String(user.user_metadata.school_id) : ""

  if (metadataActiveRole === "parent" || metadataRole === "parent") {
    const studentIds = await getParentStudentIdsFromClient(user.id, email)

    return {
      userId: String(user.id),
      email,
      role: "parent",
      schoolId: metadataSchoolId,
      subdomain: "",
      next: "/parent",
      studentIds,
      school_id: metadataSchoolId,
    }
  }

  const effectiveRole =
    metadataActiveRole === "admin" ||
    metadataActiveRole === "teacher" ||
    metadataActiveRole === "parent" ||
    (metadataActiveRole === "super_admin" && isSuperAdminEmail(email))
      ? metadataActiveRole
      : metadataRole === "super_admin" && !isSuperAdminEmail(email)
      ? null
      : metadataRole

  if (
    metadataActiveRole === "admin" ||
    metadataActiveRole === "teacher" ||
    metadataActiveRole === "parent" ||
    (metadataActiveRole === "super_admin" && isSuperAdminEmail(email)) ||
    (metadataRole === "super_admin" && isSuperAdminEmail(email))
  ) {
    return {
      userId: String(user.id),
      email,
      role: effectiveRole,
      schoolId: metadataSchoolId,
      subdomain: "",
      next:
        effectiveRole === "admin"
          ? "/admin"
          : effectiveRole === "teacher"
          ? "/teacher"
          : effectiveRole === "super_admin" && isSuperAdminEmail(email)
          ? "/super-admin"
          : "/parent",
      studentIds: [],
      school_id: metadataSchoolId,
    }
  }

  if (email) {
    const studentIds = await getParentStudentIdsFromClient(user.id, email)

    if (studentIds.length > 0) {
      return {
        userId: String(user.id),
        email,
        role: "parent",
        schoolId: metadataSchoolId,
        subdomain: "",
        next: "/parent",
        studentIds,
        school_id: metadataSchoolId,
      }
    }
  }

  return null
}

async function getParentStudentIdsFromClient(userId: string, email: string) {
  const { data: linkedParents } = await supabase
    .from("parents")
    .select("student_id")
    .eq("auth_id", userId)

  const linkedStudentIds = [...new Set(((linkedParents || []).map((parent) => parent.student_id)).filter(Boolean))]

  if (linkedStudentIds.length > 0) {
    return linkedStudentIds
  }

  if (!email) {
    return []
  }

  const { data: emailParents } = await supabase
    .from("parents")
    .select("student_id")
    .eq("email", email)

  return [...new Set(((emailParents || []).map((parent) => parent.student_id)).filter(Boolean))]
}

export async function getUserRole() {
  const context = await getAuthSessionContext()

  if (!context) {
    return null
  }

  return {
    role: context.role,
    school_id: context.schoolId,
  }
}
