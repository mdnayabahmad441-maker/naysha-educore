"use client"

import { supabase } from "@/lib/supabase"
import { resolveTenantOrigin } from "@/lib/auth-storage"
import { sanitizeNextPath, sanitizeSubdomain } from "@/lib/security"

type AuthDestination = {
  next: "/admin" | "/teacher" | "/parent"
  subdomain: string
}

function getCurrentSubdomain() {
  if (typeof window === "undefined") return null

  const host = window.location.hostname
  const subdomain = host.split(".")[0]

  if (
    host.includes("localhost") ||
    subdomain === "www" ||
    subdomain === "erp" ||
    subdomain === "naysha"
  ) {
    return null
  }

  return subdomain
}

async function findSchoolSubdomain(schoolId: string) {
  const { data: school } = await supabase
    .from("schools")
    .select("subdomain")
    .eq("id", schoolId)
    .maybeSingle()

  return school?.subdomain || getCurrentSubdomain()
}

async function updateUserMetadataIfNeeded(user: any, schoolId: string, role: string) {
  const currentMetadata = user.user_metadata || {}

  if (currentMetadata.school_id !== schoolId || currentMetadata.role !== role) {
    await supabase.auth.updateUser({
      data: {
        ...currentMetadata,
        school_id: schoolId,
        role,
      },
    })
  }
}

export async function resolveAuthDestination(user: any, email: string): Promise<AuthDestination> {
  const normalizedEmail = email.trim().toLowerCase()
  const userId = user.id

  const stored = localStorage.getItem("onboardingData")

  if (stored) {
    const data = JSON.parse(stored)

    const { data: newSchool, error: dbError } = await supabase
      .from("schools")
      .insert({
        name: data.schoolName,
        subdomain: data.subdomain.toLowerCase().trim(),
        email: data.email,
        phone: data.phone,
      })
      .select()
      .single()

    if (dbError || !newSchool) {
      throw new Error(dbError?.message || "School creation failed")
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: newSchool.id,
      role: "admin",
    })

    await updateUserMetadataIfNeeded(user, newSchool.id, "admin")
    localStorage.removeItem("onboardingData")

    return {
      subdomain: newSchool.subdomain,
      next: "/admin",
    }
  }

  const { data: parents } = await supabase
    .from("parents")
    .select("id, student_id, school_id")
    .ilike("email", normalizedEmail)
    .limit(1)

  const parent = parents?.[0]

  if (parent) {
    let schoolId = parent.school_id

    if (!schoolId) {
      const { data: student } = await supabase
        .from("students")
        .select("school_id")
        .eq("id", parent.student_id)
        .maybeSingle()

      schoolId = student?.school_id
    }

    if (!schoolId) {
      throw new Error("Parent linked school not found")
    }

    const subdomain = await findSchoolSubdomain(schoolId)

    if (!subdomain) {
      throw new Error("School not found")
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: schoolId,
      role: "parent",
    })

    await updateUserMetadataIfNeeded(user, schoolId, "parent")

    return {
      subdomain,
      next: "/parent",
    }
  }

  const { data: teacher } = await supabase
    .from("teachers")
    .select("id, school_id")
    .ilike("email", normalizedEmail)
    .maybeSingle()

  if (teacher) {
    const subdomain = await findSchoolSubdomain(teacher.school_id)

    if (!subdomain) {
      throw new Error("School not found")
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: teacher.school_id,
      role: "teacher",
    })

    await supabase
      .from("teachers")
      .update({ auth_id: userId })
      .eq("id", teacher.id)

    await updateUserMetadataIfNeeded(user, teacher.school_id, "teacher")

    return {
      subdomain,
      next: "/teacher",
    }
  }

  const { data: school } = await supabase
    .from("schools")
    .select("id, subdomain")
    .ilike("email", normalizedEmail)
    .maybeSingle()

  if (!school?.subdomain) {
    throw new Error("No parent, teacher, or admin account found for this email")
  }

  await supabase.from("profiles").upsert({
    id: userId,
    school_id: school.id,
    role: "admin",
  })

  await updateUserMetadataIfNeeded(user, school.id, "admin")

  return {
    subdomain: school.subdomain,
    next: "/admin",
  }
}

export async function redirectWithSession(destination: AuthDestination) {
  const next = sanitizeNextPath(destination.next)
  const subdomain = sanitizeSubdomain(destination.subdomain)

  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token
  const refreshToken = sessionData.session?.refresh_token

  if (!accessToken || !refreshToken) {
    throw new Error("Session missing")
  }

  const payload = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
    next,
  })

  if (subdomain) {
    const tenantOrigin = resolveTenantOrigin(subdomain)
    window.location.href = `${tenantOrigin}/auth/callback#${payload.toString()}`
    return
  }

  window.location.href = `/auth/callback#${payload.toString()}`
}
