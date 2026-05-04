"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getUserRole } from "@/lib/getUserRole"

export default function Unauthorized() {
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const redirect = async () => {
      try {
        // Try to determine the user's actual role and send them to the right place
        let roleData = await getUserRole()

        if (!roleData) {
          await supabase.auth.refreshSession()
          roleData = await getUserRole()
        }

        if (roleData?.role === "admin") {
          window.location.replace("/admin")
          return
        }
        if (roleData?.role === "teacher") {
          window.location.replace("/teacher")
          return
        }
        if (roleData?.role === "parent") {
          window.location.replace("/parent")
          return
        }
      } catch {
        // ignore — show access denied below
      }

      setChecking(false)
    }

    void redirect()
  }, [])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
      <div className="rounded-xl border border-white/10 bg-white/10 p-8 text-center">
        <h1 className="mb-2 text-xl font-semibold">Access Denied</h1>
        <p className="text-gray-400">You don&apos;t have permission to access this page.</p>
        <a
          href="/login"
          className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
