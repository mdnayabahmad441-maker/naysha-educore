"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { getUserRole } from "@/lib/getUserRole"
import { useSchool } from "@/context/SchoolContext"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const session = await waitForSession()

      if (!session) {
        window.location.href = "/login"
        return
      }

      const roleData = await getUserRole()

      if (!roleData || roleData.role !== "teacher") {
        window.location.href = "/unauthorized"
        return
      }

      setLoading(false)
    }

    checkAuth()

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
        Loading...
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
      pathname.startsWith(path)
        ? "bg-[linear-gradient(135deg,rgba(37,99,235,0.95),rgba(14,165,233,0.88))] text-white shadow-[0_16px_40px_rgba(14,116,144,0.24)]"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  const mobileTabStyle = (path: string) =>
    `flex min-w-0 flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
      pathname.startsWith(path)
        ? "bg-white/12 text-white"
        : "text-slate-400 hover:text-white"
    }`

  return (
    <div className="flex min-h-screen bg-[#020c1b] text-white">
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 flex w-64 flex-col overflow-hidden border-r border-white/10 bg-[#0b1a33] p-6 transition-transform duration-300 md:static ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="bg-linear-to-r from-blue-200 to-cyan-300 bg-clip-text text-lg font-bold text-transparent md:text-xl">
            {school?.name || "Teacher Panel"}
          </h1>
          <button
            type="button"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <nav className="mt-8 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 pb-6 text-sm">
          <Link href="/teacher" className={linkStyle("/teacher")} onClick={() => setOpen(false)}>
            Dashboard
          </Link>

          <p className="mt-6 mb-2 text-xs uppercase text-gray-500">
            Academics
          </p>

          <Link href="/teacher/students" className={linkStyle("/teacher/students")} onClick={() => setOpen(false)}>
            Students
          </Link>

          <Link href="/teacher/attendance" className={linkStyle("/teacher/attendance")} onClick={() => setOpen(false)}>
            Attendance
          </Link>

          <Link href="/teacher/exams" className={linkStyle("/teacher/exams")} onClick={() => setOpen(false)}>
            Create Exam
          </Link>

          <Link href="/teacher/marks" className={linkStyle("/teacher/marks")} onClick={() => setOpen(false)}>
            Enter Marks
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

      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/10 bg-[#0b1a33] px-4 py-4 md:px-8">
          <div className="md:hidden">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_38%),linear-gradient(135deg,rgba(12,22,45,0.96),rgba(11,26,51,0.88))] px-4 py-4 shadow-[0_24px_60px_rgba(2,8,23,0.42)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
                    Teacher Workspace
                  </p>
                  <h2 className="mt-2 truncate text-lg font-semibold text-white">
                    {school?.name || "Teacher Panel"}
                  </h2>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    Faster attendance, marks, and class updates on mobile.
                  </p>
                </div>

                <button
                  onClick={() => setOpen(true)}
                  className="shrink-0 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white shadow-[0_12px_28px_rgba(15,23,42,0.28)] hover:bg-white/10"
                >
                  Menu
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-100">
                  Live Session
                </span>
                <span className="truncate rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                  {school?.subdomain ? `${school.subdomain}.naysha.online` : "Teacher access"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between md:flex">
            <div>
              <h2 className="text-base font-semibold md:text-lg">
                Teacher Panel
              </h2>

              <p className="text-xs text-gray-400">
                {school?.subdomain ? `${school.subdomain}.naysha.online` : ""}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-full border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.88),rgba(190,24,93,0.88))] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:brightness-110"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 pb-28 md:p-10 md:pb-10">
          {children}
        </main>

        <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,12,22,0.96),rgba(11,26,51,0.92))] p-2 shadow-[0_24px_70px_rgba(2,8,23,0.5)] backdrop-blur md:hidden">
          <div className="flex items-center gap-1">
            <Link href="/teacher" className={mobileTabStyle("/teacher")}>
              <span>Home</span>
            </Link>
            <Link href="/teacher/attendance" className={mobileTabStyle("/teacher/attendance")}>
              <span>Attendance</span>
            </Link>
            <Link href="/teacher/marks" className={mobileTabStyle("/teacher/marks")}>
              <span>Marks</span>
            </Link>
            <Link href="/teacher/students" className={mobileTabStyle("/teacher/students")}>
              <span>Students</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}
