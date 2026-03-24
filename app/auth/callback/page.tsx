"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackPage() {

  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {

    const access_token = params.get("access_token")
    const refresh_token = params.get("refresh_token")

    if (!access_token || !refresh_token) {
      router.push("/login")
      return
    }

    // 🔥 SET SESSION ON SUBDOMAIN
    supabase.auth.setSession({
      access_token,
      refresh_token
    }).then(() => {
      router.push("/admin")
    })

  }, [])

  return (
    <div className="text-white p-10">
      Logging you in...
    </div>
  )
}