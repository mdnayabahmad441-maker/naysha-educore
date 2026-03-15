"use client"

import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Topbar() {

  const router = useRouter()

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="w-full bg-slate-900 text-white p-4 flex justify-end">
      <button onClick={logout} className="bg-red-600 px-4 py-2 rounded">
        Logout
      </button>
    </div>
  )
}