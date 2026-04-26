import { User } from "@supabase/supabase-js"
import { supabaseAdmin } from "@/lib/supabase-admin"

export type AccountRole = "admin" | "teacher" | "parent"
export type LoginMethod = "otp"

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

  return data?.subdomain || data?.domain || null
}

async function getParentRows(user: User) {
  const email = user.email!.toLowerCase()

  // 🔹 1. STRICT auth_id match (primary)
  const { data: byAuth } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("auth_id", user.id)

  if (byAuth && byAuth.length > 0) return byAuth as ParentRow[]

  // 🔹 2. Exact email fallback (SAFE)
  const { data: byEmail } = await supabaseAdmin
    .from("parents")
    .select("id, student_id, school_id")
    .eq("email", email)

  return (byEmail || []) as ParentRow[]
}

async function resolveParentSchool(rows: ParentRow[]) {
  const direct = rows.find(r => r.school_id)?.school_id
  if (direct) return direct

  const studentIds = rows
    .map(r => r.student_id)
    .filter(Boolean) as string[]

  if (studentIds.length === 0) return null

  const { data } = await supabaseAdmin
    .from("students")
    .select("school_id")
    .in("id", studentIds)

  return data?.find(s => s.school_id)?.school_id || null
}

export async function resolveUserAccess(user: User, _preferredRole?: AccountRole): Promise<ResolvedUserAccess | null> {
  const email = user.email?.toLowerCase()

  if (!email) throw new Error("User email missing")

  console.log("🔍 USER:", user.id, email)

  // =========================
  // 🟢 PARENT
  // =========================
  const parentRows = await getParentRows(user)

  console.log("👪 Parent rows:", parentRows)

  if (parentRows.length > 0) {
    // Link auth_id if missing
    await supabaseAdmin
      .from("parents")
      .update({ auth_id: user.id })
      .eq("email", email)

    const studentIds = [
      ...new Set(parentRows.map(p => p.student_id).filter(Boolean)),
    ] as string[]

    const schoolId =
      (await resolveParentSchool(parentRows)) ||
      user.user_metadata?.school_id ||
      null

    if (!schoolId) {
      return {
        userId: user.id,
        email,
        role: "parent",
        schoolId: "",
        subdomain: "",
        next: "/parent",
        studentIds,
        school_id: "",
      }
    }

    const subdomain = await findSchoolSubdomain(schoolId)

    if (!subdomain) throw new Error("School config missing")

    return {
      userId: user.id,
      email,
      role: "parent",
      schoolId,
      subdomain,
      next: "/parent",
      studentIds,
      school_id: schoolId,
    }
  }

  // =========================
  // 🟡 TEACHER
  // =========================
  const { data: teacher } = await supabaseAdmin
    .from("teachers")
    .select("id, school_id")
    .eq("auth_id", user.id)
    .maybeSingle()

  const teacherFinal =
    teacher ||
    (
      await supabaseAdmin
        .from("teachers")
        .select("id, school_id")
        .eq("email", email)
        .maybeSingle()
    ).data

  if (teacherFinal?.school_id) {
    const subdomain = await findSchoolSubdomain(teacherFinal.school_id)

    if (!subdomain) throw new Error("School not found")

    return {
      userId: user.id,
      email,
      role: "teacher",
      schoolId: teacherFinal.school_id,
      subdomain,
      next: "/teacher",
      studentIds: [],
      school_id: teacherFinal.school_id,
    }
  }

  // =========================
  // 🔵 ADMIN
  // =========================
  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id, subdomain, domain")
    .eq("email", email)
    .maybeSingle()

  if (school?.id) {
    const subdomain = school.subdomain || school.domain

    if (!subdomain) return null

    return {
      userId: user.id,
      email,
      role: "admin",
      schoolId: school.id,
      subdomain,
      next: "/admin",
      studentIds: [],
      school_id: school.id,
    }
  }

  return null
}

// ── Account-lookup helpers (used by API routes + login page) ────────────────

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const USERNAME_PATTERN = /^[a-z0-9._-]{4,50}$/

export function isEmailIdentifier(identifier: string) {
  return EMAIL_PATTERN.test(identifier.trim().toLowerCase())
}

export function isUsernameIdentifier(identifier: string) {
  return USERNAME_PATTERN.test(identifier.trim().toLowerCase())
}

export async function resolveUsernameToEmail(identifier: string): Promise<string | null> {
  const normalizedUsername = identifier.trim().toLowerCase()
  let page = 1

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error("Lookup failed")
    const match = data.users.find(
      (u) => String(u.user_metadata?.username || "").trim().toLowerCase() === normalizedUsername
    )
    if (match?.email) return match.email.toLowerCase()
    if (data.users.length < 200) break
    page++
  }

  return null
}

export async function resolveAccountByEmail(email: string): Promise<ResolvedAccount | null> {
  const normalizedEmail = email.trim().toLowerCase()

  const [{ data: parents }, { data: teacher }, { data: school }] = await Promise.all([
    supabaseAdmin.from("parents").select("id").ilike("email", normalizedEmail).limit(1),
    supabaseAdmin.from("teachers").select("id").ilike("email", normalizedEmail).maybeSingle(),
    supabaseAdmin.from("schools").select("id").ilike("email", normalizedEmail).maybeSingle(),
  ])

  if ((parents || []).length > 0) return { email: normalizedEmail, role: "parent", loginMethod: "otp" }
  if (teacher?.id) return { email: normalizedEmail, role: "teacher", loginMethod: "otp" }
  if (school?.id) return { email: normalizedEmail, role: "admin", loginMethod: "otp" }

  return null
}

export async function resolveIdentifierToAccount(identifier: string): Promise<ResolvedAccount | null> {
  const normalized = identifier.trim().toLowerCase()
  if (!normalized) return null

  if (isEmailIdentifier(normalized)) return resolveAccountByEmail(normalized)
  if (!isUsernameIdentifier(normalized)) return null

  const email = await resolveUsernameToEmail(normalized)
  if (!email) return null

  return resolveAccountByEmail(email)
}