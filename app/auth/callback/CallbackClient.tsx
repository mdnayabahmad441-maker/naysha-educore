"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"

function readTokenParams() {
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : null

  const query = new URLSearchParams(window.location.search)

  return {
    accessToken: hash?.get("access_token") || null,
    refreshToken: hash?.get("refresh_token") || null,
  }
}

function roleToDestination(role: string | undefined): string {
  if (role === "teacher") return "/teacher"
  if (role === "parent") return "/parent"
  return "/admin"
}

export default function CallbackClient() {
  const params = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const { accessToken, refreshToken } = readTokenParams()

      // No tokens — check for existing session and route by role
      if (!accessToken || !refreshToken) {
        const existingSession = await waitForSession(3, 150)
        if (existingSession) {
          const role =
            existingSession.user?.user_metadata?.active_role ||
            existingSession.user?.user_metadata?.role
          window.location.href = roleToDestination(role)
        } else {
          window.location.href = "/login"
        }
        return
      }

      // Set session from URL tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error("❌ setSession error:", error)
        window.location.href = "/login"
        return
      }

      // Wait for session to be established
      const confirmedSession = await waitForSession(5, 200)

      if (!confirmedSession) {
        console.error("❌ Session not established")
        window.location.href = "/login"
        return
      }

      // Refresh to ensure JWT has latest metadata (role, school_id)
      for (let i = 0; i < 3; i++) {
        await supabase.auth.refreshSession()
        await new Promise((res) => setTimeout(res, 400))
      }

      // Read role from freshly refreshed JWT — this is authoritative
      const { data: freshSession } = await supabase.auth.getSession()
      const jwtRole =
        freshSession.session?.user?.user_metadata?.active_role ||
        freshSession.session?.user?.user_metadata?.role

      const destination = roleToDestination(jwtRole)

      // Clean up URL and redirect
      window.history.replaceState({}, document.title, "/auth/callback")
      await new Promise((res) => setTimeout(res, 300))
      window.location.href = destination
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Finalizing login...</div>
}
