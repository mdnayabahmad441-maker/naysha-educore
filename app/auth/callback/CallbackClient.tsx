"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackClient() {

  const params = useSearchParams()

  useEffect(() => {

    const run = async () => {

      const access_token = params.get("access_token")
      const refresh_token = params.get("refresh_token")
      const subdomain = params.get("subdomain") // 🔥 ADD THIS
      const next = params.get("next") || "/admin"

      if (!access_token || !refresh_token) {
        window.location.href = "/login"
        return
      }

      // 🔥 REDIRECT TO SUBDOMAIN WITH TOKENS
      if (subdomain) {
        window.location.href =
          `https://${subdomain}.naysha.online/auth/callback` +
          `?access_token=${access_token}` +
          `&refresh_token=${refresh_token}` +
          `&next=${next}`
        return
      }

      // ✅ fallback (same domain)
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (error) {
        console.error("Callback session error:", error)
        window.location.href = "/login"
        return
      }

      window.location.href = next

    }

    run()

  }, [])

  return (
    <div className="text-white p-10">
      Logging you in...
    </div>
  )
}
