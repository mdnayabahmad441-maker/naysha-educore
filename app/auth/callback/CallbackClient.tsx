"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
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
        window.location.href = "/login"
        return
      }

      if (subdomain) {
        const currentHost = window.location.hostname
        const targetHost = `${subdomain}.naysha.online`

        if (currentHost !== targetHost) {
          const payload = new URLSearchParams({
            access_token: accessToken,
            refresh_token: refreshToken,
            next,
          })

          window.location.href = `https://${targetHost}/auth/callback#${payload.toString()}`
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

      window.history.replaceState({}, document.title, "/auth/callback")
      window.location.href = next
    }

    void run()
  }, [params])

  return <div className="p-10 text-white">Logging you in...</div>
}
