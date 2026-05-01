"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const session = await waitForSession()

      if (!session) {
        window.location.href = "/login"
        return
      }

      // ✅ REAL CHECK: must have linked student
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await wait(400)

        try {
          const studentIds = await getCurrentParentStudentIds()
          console.log("Parent access check:", studentIds)

          if (studentIds.length > 0) {
            setLoading(false)
            return
          }
        } catch (e) {
          console.warn("Parent check error:", e)
        }

        // 🔁 refresh session (important after login)
        await supabase.auth.refreshSession()
      }

      // ❌ If no students → block access
      window.location.href = "/unauthorized"
    }

    void checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        window.location.href = "/login"
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut({ scope: "local" })
    window.location.href = "/login"
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
      pathname.startsWith(path)
        ? "bg-white/20 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
        Loading...
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#020c1b] text-white md:flex-row">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0b1a33] p-6 hidden md:block">
        <h1 className="mb-6 text-xl font-bold">Parent Panel</h1>

        <nav className="flex flex-col gap-2">
          <Link href="/parent" className={linkStyle("/parent")}>Dashboard</Link>
          <Link href="/parent/attendance" className={linkStyle("/parent/attendance")}>Attendance</Link>
          <Link href="/parent/fees" className={linkStyle("/parent/fees")}>Fees</Link>
          <Link href="/parent/results" className={linkStyle("/parent/results")}>Results</Link>
        </nav>

        <button
          onClick={logout}
          className="mt-6 w-full rounded-lg bg-red-500 px-4 py-2"
        >
          Sign Out
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/10 bg-[#0b1a33] px-6 py-4">
          <h2 className="text-lg font-semibold">Parent Dashboard</h2>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}