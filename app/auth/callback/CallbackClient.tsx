"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"

type KnownRole = "admin" | "teacher" | "parent"

function isKnownRole(value: unknown): value is KnownRole {
  return value === "admin" || value === "teacher" || value === "parent"
}

function roleToDestination(role: KnownRole): string {
  if (role === "teacher") return "/teacher"
  if (role === "parent") return "/parent"
  return "/admin"
}

function readTokensFromUrl() {
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : null
  return {
    accessToken: hash?.get("access_token") || null,
    refreshToken: hash?.get("refresh_token") || null,
  }
}

async function resolveRoleFromJwt(): Promise<KnownRole | null> {
  const { data } = await supabase.auth.getSession()
  const meta = data.session?.user?.user_metadata
  const role = meta?.active_role || meta?.role
  return isKnownRole(role) ? role : null
}

async function resolveRoleFromServer(accessToken: string): Promise<KnownRole | null> {
  try {
    const res = await fetch("/api/auth/session", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return isKnownRole(data?.role) ? data.role : null
  } catch {
    return null
  }
}

export default function CallbackClient() {
  const params = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const { accessToken, refreshToken } = readTokensFromUrl()

      // No tokens in URL — route existing session by role, or send to login
      if (!accessToken || !refreshToken) {
        const session = await waitForSession(3, 200)
        if (!session) {
          window.location.href = "/login"
          return
        }
        const meta = session.user?.user_metadata
        const role = meta?.active_role || meta?.role
        window.location.href = isKnownRole(role)
          ? roleToDestination(role)
          : "/login"
        return
      }

      // Establish session from URL tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) {
        console.error("setSession error:", error)
        window.location.href = "/login"
        return
      }

      const confirmed = await waitForSession(5, 200)
      if (!confirmed) {
        window.location.href = "/login"
        return
      }

      // Refresh JWT up to 4 times to let Supabase propagate role metadata
      for (let i = 0; i < 4; i++) {
        await supabase.auth.refreshSession()
        await new Promise((res) => setTimeout(res, 500))
        const role = await resolveRoleFromJwt()
        if (role) {
          window.history.replaceState({}, document.title, "/auth/callback")
          await new Promise((res) => setTimeout(res, 200))
          window.location.href = roleToDestination(role)
          return
        }
      }

      // JWT metadata still missing — fall back to server-side DB lookup
      const { data: freshData } = await supabase.auth.getSession()
      const freshToken = freshData.session?.access_token
      if (freshToken) {
        const serverRole = await resolveRoleFromServer(freshToken)
        if (serverRole) {
          window.history.replaceState({}, document.title, "/auth/callback")
          await new Promise((res) => setTimeout(res, 200))
          window.location.href = roleToDestination(serverRole)
          return
        }
      }

      // Cannot determine role — send to login
      window.location.href = "/login"
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Finalizing login...</div>
}
