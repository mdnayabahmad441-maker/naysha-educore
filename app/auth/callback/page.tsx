"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {

  const router = useRouter()

  useEffect(() => {

    async function handleAuth() {

      const { data } = await supabase.auth.getSession()

      if (data.session) {
        router.push("/erp/dashboard")
      } else {
        router.push("/erp/login")
      }

    }

    handleAuth()

  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-slate-950">
      Verifying email...
    </div>
  )

}