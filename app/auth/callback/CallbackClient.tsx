"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  canShareSessionAcrossSubdomains,
  resolveTenantOrigin,
} from "@/lib/auth-storage"
import { waitForSession } from "@/lib/auth-session"
import { sanitizeNextPath, sanitizeSubdomain } from "@/lib/security"

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
      const subdomain = sanitizeSubdomain(params.get("subdomain"))

      // =========================
      // 1. NO TOKENS CASE
      // =========================
      if (!accessToken || !refreshToken) {
        const existingSession = await waitForSession(3, 150)

        if (existingSession) {
          window.location.href = next
          return
        }

        window.location.href = "/login"
        return
      }

      // =========================
      // 2. HANDLE SUBDOMAIN
      // =========================
      if (subdomain && !canShareSessionAcrossSubdomains()) {
        const currentOrigin = window.location.origin
        const targetOrigin = resolveTenantOrigin(subdomain)

        if (currentOrigin !== targetOrigin) {
          const payload = new URLSearchParams({
            access_token: accessToken,
            refresh_token: refreshToken,
            next,
          })

          window.location.href = `${targetOrigin}/auth/callback#${payload.toString()}`
          return
        }
      }

      // =========================
      // 3. SET SESSION
      // =========================
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error("❌ setSession error:", error)
        window.location.href = "/login"
        return
      }

      // =========================
      // 4. WAIT FOR SESSION
      // =========================
      const confirmedSession = await waitForSession(5, 200)

      if (!confirmedSession) {
        console.error("❌ Session not established")
        window.location.href = "/login"
        return
      }

      // =========================
      // 5. HARD REFRESH LOOP (CRITICAL FIX)
      // =========================
      for (let i = 0; i < 3; i++) {
        await supabase.auth.refreshSession()
        await new Promise((res) => setTimeout(res, 400))
      }

      // =========================
      // 6. VERIFY USER (DEBUG)
      // =========================
      const { data: userData } = await supabase.auth.getUser()
      console.log("✅ FINAL USER:", userData)

      // =========================
      // 7. CLEAN URL
      // =========================
      window.history.replaceState({}, document.title, "/auth/callback")

      // =========================
      // 8. FINAL DELAY (VERY IMPORTANT)
      // =========================
      await new Promise((res) => setTimeout(res, 500))

      // =========================
      // 9. REDIRECT
      // =========================
      window.location.href = next
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Finalizing login...</div>
}