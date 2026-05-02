"use client"

import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { resolveTenantOrigin } from "@/lib/auth-storage"
import { sanitizeNextPath, sanitizeSubdomain } from "@/lib/security"

export type AuthDestination = {
  next: "/admin" | "/teacher" | "/parent"
  subdomain: string
  role?: string
  school_id?: string
  student_ids?: string[]
}

export async function resolveAuthDestination(
  user: any,
  email: string,
  preferredRole?: "admin" | "teacher" | "parent"
): Promise<AuthDestination> {
  const normalizedEmail = email.trim().toLowerCase()
  const userId = user.id

  // Handle first-time school creation (onboarding flow)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("onboardingData")

    if (stored) {
      const data = JSON.parse(stored)

      const { data: newSchool, error } = await supabase
        .from("schools")
        .insert({
          name: data.schoolName,
          subdomain: data.subdomain.toLowerCase().trim(),
          email: data.email,
          phone: data.phone,
        })
        .select()
        .single()

      if (error || !newSchool) {
        throw new Error(error?.message || "School creation failed")
      }

      await Promise.all([
        supabase.from("profiles").upsert({
          id: userId,
          school_id: newSchool.id,
          role: "admin",
        }),
        supabase.auth.updateUser({
          data: { school_id: newSchool.id, role: "admin", active_role: "admin" },
        }),
      ])

      localStorage.removeItem("onboardingData")

      return { subdomain: newSchool.subdomain, next: "/admin" }
    }
  }

  // Wait for an active session — retry with a refresh if the first pass fails
  let session = await waitForSession(10, 200)

  if (!session) {
    // 🔥 FORCE HARD REFRESH OF SESSION
await supabase.auth.refreshSession()

// wait a bit so updated JWT is applied
await new Promise((res) => setTimeout(res, 500))

// 🔥 DOUBLE CHECK SESSION
const { data: refreshed } = await supabase.auth.getSession()

if (!refreshed.session) {
  throw new Error("Session not refreshed properly")
}
    session = await waitForSession(6, 300)
  }

  const accessToken = session?.access_token

  if (!accessToken) {
    throw new Error("Session not ready — please try again")
  }

  const response = await fetch("/api/auth/resolve-destination", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      email: normalizedEmail,
      preferredRole: preferredRole || null,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Failed to resolve account")
  }

  // Refresh so the client JWT picks up the role/school_id written by the server
  await supabase.auth.refreshSession()

  return {
    next: result.next,
    subdomain: result.subdomain || "",
    role: result.role,
    school_id: result.school_id,
    student_ids: Array.isArray(result.student_ids) ? result.student_ids : [],
  }
}

export async function redirectWithSession(destination: AuthDestination) {
  const next = sanitizeNextPath(destination.next)
  const subdomain = sanitizeSubdomain(destination.subdomain)

  const { data: sessionData } = await supabase.auth.getSession()

  const accessToken = sessionData.session?.access_token
  const refreshToken = sessionData.session?.refresh_token

  if (!accessToken || !refreshToken) {
    throw new Error("Session missing — please log in again")
  }

  const payload = new URLSearchParams({
    access_token: accessToken,
    refresh_token: refreshToken,
    next,
  })

  // Parents stay on the current domain — no subdomain redirect needed
  // (parent pages resolve school via session school_id, not subdomain)
  if (subdomain && next !== "/parent") {
    const tenantOrigin = resolveTenantOrigin(subdomain)
    window.location.href = `${tenantOrigin}/auth/callback?next=${encodeURIComponent(next)}#${payload.toString()}`
    return
  }

  window.location.href = `/auth/callback?next=${encodeURIComponent(next)}#${payload.toString()}`
}
