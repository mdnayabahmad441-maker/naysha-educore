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

  return {
    accessToken: hash?.get("access_token") || null,
    refreshToken: hash?.get("refresh_token") || null,
    next: sanitizeNextPath(hash?.get("next")),
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

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      if (error) {
        console.error("Callback session error:", error)
        window.location.href = "/login"
        return
      }

      const confirmedSession = await waitForSession()

      if (!confirmedSession) {
        window.location.href = "/login"
        return
      }

      window.history.replaceState({}, document.title, "/auth/callback")
      window.location.href = next
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Logging you in...</div>
}
