"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { canShareSessionAcrossSubdomains, resolveTenantOrigin } from "@/lib/auth-storage"
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

      if (!accessToken || !refreshToken) {
        const existingSession = await waitForSession(3, 150)

        if (existingSession) {
          window.location.href = next
          return
        }

        window.location.href = "/login"
        return
      }

      // 🔁 Handle subdomain redirect first
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

      // ✅ STEP 1: Set session
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error("Callback session error:", error)
        window.location.href = "/login"
        return
      }

      // ✅ STEP 2: Wait for session
      const confirmedSession = await waitForSession()

      if (!confirmedSession) {
        window.location.href = "/login"
        return
      }

      // 🚨 STEP 3: FORCE REFRESH (THIS WAS MISSING)
      await supabase.auth.refreshSession()

      // ✅ STEP 4: OPTIONAL CHECK (debug)
      const { data: userData } = await supabase.auth.getUser()
      console.log("User after refresh:", userData)

      // Clean URL
      window.history.replaceState({}, document.title, "/auth/callback")

      // ✅ FINAL REDIRECT
      window.location.href = next
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Logging you in...</div>
}