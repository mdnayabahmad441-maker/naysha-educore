"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { sanitizeNextPath } from "@/lib/security"

function readTokenParams() {
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : null

  const query = new URLSearchParams(window.location.search)

  return {
    accessToken: hash?.get("access_token") || null,
    refreshToken: hash?.get("refresh_token") || null,
    next: sanitizeNextPath(hash?.get("next") || query.get("next")),
  }
}

export default function CallbackClient() {
  const params = useSearchParams()

  useEffect(() => {
    const run = async () => {
      const { accessToken, refreshToken, next } = readTokenParams()

      // No tokens — check for existing session
      if (!accessToken || !refreshToken) {
        const existingSession = await waitForSession(3, 150)
        window.location.href = existingSession ? next : "/login"
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

      // Clean up URL and redirect
      window.history.replaceState({}, document.title, "/auth/callback")
      await new Promise((res) => setTimeout(res, 300))
      window.location.href = next
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Finalizing login...</div>
}
