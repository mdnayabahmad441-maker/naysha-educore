import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { isSuperAdminEmail } from "@/lib/super-admin"

type AllowedRole = "admin" | "teacher" | "parent" | "super_admin"

export type AuthorizedProfile = {
  userId: string
  schoolId: string | null
  role: AllowedRole
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || ""

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null
  }

  return authHeader.slice(7).trim() || null
}

async function ensureSchoolIsActive(schoolId: string | null | undefined) {
  if (!schoolId) return null

  const { data, error } = await supabaseAdmin
    .from("schools")
    .select("status")
    .eq("id", schoolId)
    .maybeSingle()

  if (error) {
    const text = `${error.code || ""} ${error.message || ""}`.toLowerCase()
    if (text.includes("column") || text.includes("schema cache") || error.code === "42703" || error.code === "PGRST204") {
      return null
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (data?.status === "suspended") {
    return NextResponse.json(
      { error: "This school account is suspended. Please contact NaySha EduCore support." },
      { status: 403 }
    )
  }

  return null
}

export async function requireAuthorizedProfile(
  request: Request,
  allowedRoles: AllowedRole[]
): Promise<{ profile: AuthorizedProfile } | { response: NextResponse }> {
  const token = getBearerToken(request)

  if (!token) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !authData.user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const userId = authData.user.id
  const email = (authData.user.email || "").trim().toLowerCase()

  if (
    allowedRoles.includes("super_admin") &&
    isSuperAdminEmail(email)
  ) {
    return {
      profile: {
        userId,
        schoolId: null,
        role: "super_admin",
      },
    }
  }

  // Try profiles table first
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("school_id, role")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role === "super_admin" && !isSuperAdminEmail(email)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  if (profile?.role && allowedRoles.includes(profile.role as AllowedRole)) {
    const suspended = await ensureSchoolIsActive(profile.school_id || null)
    if (suspended) return { response: suspended }

    return {
      profile: {
        userId,
        schoolId: profile.school_id || null,
        role: profile.role as AllowedRole,
      },
    }
  }

  // Fallback: check source tables directly so a missing/stale profiles row
  // never permanently locks out a legitimate user.
  if (allowedRoles.includes("admin") && email) {
    const { data: school } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (school?.id) {
      const suspended = await ensureSchoolIsActive(school.id)
      if (suspended) return { response: suspended }

      return { profile: { userId, schoolId: school.id, role: "admin" } }
    }
  }

  if (allowedRoles.includes("teacher") && email) {
    const { data: teacher } = await supabaseAdmin
      .from("teachers")
      .select("school_id")
      .eq("email", email)
      .maybeSingle()

    if (teacher?.school_id) {
      const suspended = await ensureSchoolIsActive(teacher.school_id)
      if (suspended) return { response: suspended }

      return { profile: { userId, schoolId: teacher.school_id, role: "teacher" } }
    }
  }

  if (allowedRoles.includes("parent") && email) {
    const { data: parentRows } = await supabaseAdmin
      .from("parents")
      .select("school_id")
      .eq("email", email)
      .limit(1)

    const schoolId = parentRows?.[0]?.school_id || null
    if (parentRows && parentRows.length > 0) {
      const suspended = await ensureSchoolIsActive(schoolId)
      if (suspended) return { response: suspended }

      return { profile: { userId, schoolId, role: "parent" } }
    }
  }

  return {
    response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
  }
}

export async function requireAdminProfile(request: Request) {
  return requireAuthorizedProfile(request, ["admin"])
}

export function ensureSameSchool(profile: AuthorizedProfile, schoolId: string | null | undefined) {
  if (!profile.schoolId || !schoolId || profile.schoolId !== schoolId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return null
}

export function isInternalRequest(request: Request) {
  const internalHeader = request.headers.get("x-internal-service-key")
  return Boolean(
    internalHeader &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    internalHeader === process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
