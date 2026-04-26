"use client"

import { supabase } from "@/lib/supabase"
import { resolveTenantOrigin } from "@/lib/auth-storage"
import { sanitizeNextPath, sanitizeSubdomain } from "@/lib/security"

type AuthDestination = {
  next: "/admin" | "/teacher" | "/parent"
  subdomain: string
}

async function updateUserMetadataIfNeeded(user: any, schoolId: string, role: string) {
  const currentMetadata = user.user_metadata || {}
  if (currentMetadata.school_id !== schoolId || currentMetadata.role !== role) {
    await supabase.auth.updateUser({
      data: { ...currentMetadata, school_id: schoolId, role },
    })
  }
}

export async function resolveAuthDestination(user: any, email: string): Promise<AuthDestination> {
  const normalizedEmail = email.trim().toLowerCase()
  const userId = user.id

  // Handle new school admin onboarding (data stored client-side in localStorage)
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

  // All other lookups go server-side to bypass Row Level Security.
  // Client-side Supabase (anon key) can't read parent rows when auth_id is null (first login).
  const { data: sessionData } = await supabase.auth.getSession()
  const accessToken = sessionData.session?.access_token

  if (!accessToken) {
    throw new Error("Session missing")
  }

  const response = await fetch("/api/auth/resolve-destination", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email: normalizedEmail }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || "Failed to resolve account")
  }

  return {
    next: result.next,
    subdomain: result.subdomain,
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
