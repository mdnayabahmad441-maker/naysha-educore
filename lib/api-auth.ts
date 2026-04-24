import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

type AllowedRole = "admin" | "teacher" | "parent"

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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("school_id, role")
    .eq("id", authData.user.id)
    .maybeSingle()

  if (profileError || !profile?.role || !allowedRoles.includes(profile.role as AllowedRole)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return {
    profile: {
      userId: authData.user.id,
      schoolId: profile.school_id || null,
      role: profile.role as AllowedRole,
    },
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
