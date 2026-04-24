"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { getUserRole } from "@/lib/getUserRole"
import { useEffect, useState } from "react"

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

      const roleData = await getUserRole()
      const metadataRole = session.user.user_metadata?.role

      if (roleData?.role !== "parent" && metadataRole !== "parent") {
        window.location.href = "/unauthorized"
        return
      }

      setLoading(false)
    }

    void checkAuth()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition ${
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

    <div className="flex min-h-screen flex-col bg-[#020c1b] text-white md:flex-row">

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-full max-w-[320px] transform border-r border-white/10 bg-[#0b1a33] p-6 transition-transform duration-300 md:static md:translate-x-0 md:w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        <div className="flex items-center justify-between gap-4 md:block">
          <h1 className="text-xl font-bold mb-6 md:mb-8">
            Parent Panel
          </h1>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden" onClick={() => setSidebarOpen(false)}>
            Close
          </button>
        </div>

        <nav className="flex flex-col gap-2 text-sm">

<Link href="/parent" className={linkStyle("/parent")} onClick={() => setSidebarOpen(false)}> 
            🏠 Dashboard
          </Link>

          <Link href="/parent/attendance" className={linkStyle("/parent/attendance")} onClick={() => setSidebarOpen(false)}> 
            📅 Attendance
          </Link>

          <Link href="/parent/fees" className={linkStyle("/parent/fees")} onClick={() => setSidebarOpen(false)}> 
            💰 Fees
          </Link>

          <Link href="/parent/results" className={linkStyle("/parent/results")} onClick={() => setSidebarOpen(false)}> 
            📄 Results
          </Link>

        </nav>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col md:ml-64">

        {/* TOPBAR */}
        <header className="flex flex-col gap-4 px-4 py-4 bg-[#0b1a33] border-b border-white/10 md:flex-row md:items-center md:px-8">
          <div className="flex items-center justify-between gap-4 md:hidden">
            <h2 className="text-lg font-semibold">Parent Dashboard</h2>
            <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>
          </div>

          <h2 className="text-lg font-semibold">
            Parent Dashboard
          </h2>

          <button
            onClick={logout}
            className="bg-white/10 px-4 py-2 rounded"
          >
            Logout
          </button>

        </header>

        <main className="flex-1 p-4 md:p-10">
          {children}
        </main>

      </div>

    </div>
  )
}
