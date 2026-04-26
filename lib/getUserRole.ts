import { supabase } from "./supabase"

type UserRole = "admin" | "teacher" | "parent"

export type AuthSessionContext = {
  userId: string
  email: string
  role: UserRole
  schoolId: string
  subdomain: string
  next: "/admin" | "/teacher" | "/parent"
  studentIds: string[]
  school_id: string
}

export async function getAuthSessionContext(): Promise<AuthSessionContext | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    return null
  }

  const response = await fetch("/api/auth/session", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()

  if (!data?.role || !data?.schoolId) {
    return null
  }

  return {
    userId: String(data.userId),
    email: String(data.email || ""),
    role: data.role as UserRole,
    schoolId: String(data.schoolId),
    subdomain: String(data.subdomain || ""),
    next: data.next as "/admin" | "/teacher" | "/parent",
    studentIds: Array.isArray(data.studentIds) ? data.studentIds : [],
    school_id: String(data.schoolId),
  }
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
