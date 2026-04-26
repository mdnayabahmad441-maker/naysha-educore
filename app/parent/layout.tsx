"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { useEffect, useState } from "react"
import { getAuthSessionContext } from "@/lib/getUserRole"
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

      for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0) {
          await wait(500)
        }

        const context = await getAuthSessionContext()

        if (context?.role === "parent") {
          setLoading(false)
          return
        }

        const studentIds = await getCurrentParentStudentIds()

        if (studentIds.length > 0) {
          setLoading(false)
          return
        }

        await supabase.auth.refreshSession()
      }

      window.location.href = "/unauthorized"
    }

    void checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        window.location.href = "/login"
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
      pathname.startsWith(path)
        ? "bg-[linear-gradient(135deg,rgba(255,255,255,0.20),rgba(148,163,184,0.20))] text-white shadow-[0_16px_36px_rgba(15,23,42,0.28)]"
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
    <div className="flex h-screen flex-col overflow-hidden bg-[#020c1b] text-white md:flex-row">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-full max-w-[320px] flex-col overflow-hidden border-r border-white/10 bg-[#0b1a33] p-6 transition-transform duration-300 md:static md:translate-x-0 md:w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between gap-4 md:block">
          <h1 className="mb-6 bg-linear-to-r from-slate-100 to-cyan-200 bg-clip-text text-xl font-bold text-transparent md:mb-8">
            Parent Panel
          </h1>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 pb-6 text-sm">
          <Link href="/parent" className={linkStyle("/parent")} onClick={() => setSidebarOpen(false)}>
            Dashboard
          </Link>

          <Link href="/parent/attendance" className={linkStyle("/parent/attendance")} onClick={() => setSidebarOpen(false)}>
            Attendance
          </Link>

          <Link href="/parent/fees" className={linkStyle("/parent/fees")} onClick={() => setSidebarOpen(false)}>
            Fees
          </Link>

          <Link href="/parent/results" className={linkStyle("/parent/results")} onClick={() => setSidebarOpen(false)}>
            Results
          </Link>
        </nav>

        <div className="mt-6 border-t border-white/10 pt-5 md:hidden">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.18),rgba(190,24,93,0.18))] px-4 py-3 text-sm font-semibold text-red-100 shadow-[0_14px_32px_rgba(15,23,42,0.32)] transition hover:border-red-300/30 hover:bg-[linear-gradient(135deg,rgba(239,68,68,0.24),rgba(190,24,93,0.24))]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col md:ml-64">
        <header className="border-b border-white/10 bg-[#0b1a33] px-4 py-4 md:px-8">
          <div className="md:hidden">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.16),transparent_38%),linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,26,51,0.9))] px-4 py-4 shadow-[0_24px_60px_rgba(2,8,23,0.42)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                    Family Access
                  </p>
                  <h2 className="mt-2 truncate text-lg font-semibold">Parent Dashboard</h2>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    Check attendance, fees, and results quickly from your phone.
                  </p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white shadow-[0_12px_28px_rgba(15,23,42,0.28)] hover:bg-white/10"
                  onClick={() => setSidebarOpen(true)}
                >
                  Menu
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
                  Parent Login
                </span>
                <span className="truncate rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                  Mobile friendly access
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between md:flex">
            <h2 className="text-lg font-semibold">
              Parent Dashboard
            </h2>

            <button
              onClick={logout}
              className="rounded-full border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.88),rgba(190,24,93,0.88))] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:brightness-110"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          {children}
        </main>
      </div>
    </div>
  )
}
