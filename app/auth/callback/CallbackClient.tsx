"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackClient() {

  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {

    const handleAuth = async () => {

      const access_token = params.get("access_token")
      const refresh_token = params.get("refresh_token")
      const next = params.get("next") || "/admin" // 🔥 IMPORTANT

      if (!access_token || !refresh_token) {
        router.replace("/login")
        return
      }

      // 🔥 SET SESSION SAFELY
      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      })

      if (error) {
        console.error("Session error:", error)
        router.replace("/login")
        return
      }

      // 🔥 CLEAN REDIRECT (VERY IMPORTANT)
      router.replace(next)

    }

    handleAuth()

  }, [])

  return (
    <div className="text-white p-10">
      Logging you in...
    </div>
  )
}