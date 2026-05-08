"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { waitForSession } from "@/lib/auth-session"
import { getUserRole } from "@/lib/getUserRole"
import { useSchool } from "@/context/SchoolContext"
import { getCurrentTeacher } from "@/lib/role-access"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [teacherName, setTeacherName] = useState("")

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await waitForSession()

        if (!session) {
          window.location.href = "/login"
          return
        }

        let roleData = null
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise((r) => setTimeout(r, 600))
          roleData = await getUserRole()
          if (roleData?.role === "teacher") {
            break
          }
        }

        if (roleData?.role !== "teacher") {
          window.location.href = "/unauthorized"
          return
        }

        const teacher = await getCurrentTeacher()
        if (teacher?.name) {
          setTeacherName(teacher.name)
        }

        setLoading(false)
      } catch (error) {
        console.error("Auth error:", error)
        window.location.href = "/login"
      }
    }

    checkAuth()

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main) text-(--text-main)">
        <div className="spinner" />
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${
      pathname.startsWith(path)
        ? "nav-link-active"
        : "nav-link-inactive"
    }`

  const mobileTabStyle = (path: string) =>
    `flex min-w-0 flex-1 flex-col items-center rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
      pathname.startsWith(path)
        ? "text-(--text-main) bg-white/10"
        : "text-(--text-muted) hover:text-(--text-main)"
    }`

  return (
    <div className="flex h-screen overflow-hidden bg-(--bg-main) text-(--text-main)">
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 flex h-full w-64 flex-col overflow-hidden border-r border-(--border) bg-(--bg-card) p-6 transition-transform duration-300 md:static ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="bg-linear-to-r from-(--color-accent) to-(--color-accent-2) bg-clip-text text-lg font-bold text-transparent md:text-xl">
            {school?.name || "Teacher Panel"}
          </h1>
          <button
            type="button"
            className="rounded-lg border border-(--border) px-3 py-2 text-sm text-(--text-main) hover:bg-white/5 md:hidden"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        <div className="mt-4 pb-4 border-b border-(--border)">
          <p className="text-xs text-(--text-muted)">Logged in as</p>
          <p className="text-sm font-semibold text-(--text-main) truncate">{teacherName || "Teacher"}</p>
        </div>

        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 pb-6 text-sm">
          <Link href="/teacher" className={`nav-link ${linkStyle("/teacher")}`} onClick={() => setOpen(false)}>
            Dashboard
          </Link>

          <p className="mt-6 mb-2 text-xs uppercase text-(--text-muted)">
            Academics
          </p>

          <Link href="/teacher/students" className={`nav-link ${linkStyle("/teacher/students")}`} onClick={() => setOpen(false)}>
            My Students
          </Link>

          <Link href="/teacher/attendance" className={`nav-link ${linkStyle("/teacher/attendance")}`} onClick={() => setOpen(false)}>
            Student Attendance
          </Link>

          <Link href="/teacher/my-attendance" className={`nav-link ${linkStyle("/teacher/my-attendance")}`} onClick={() => setOpen(false)}>
            My Attendance
          </Link>

          <Link href="/teacher/exams" className={`nav-link ${linkStyle("/teacher/exams")}`} onClick={() => setOpen(false)}>
            Exams
          </Link>

          <Link href="/teacher/marks" className={`nav-link ${linkStyle("/teacher/marks")}`} onClick={() => setOpen(false)}>
            Enter Marks
          </Link>

          <Link href="/teacher/question-paper" className={`nav-link ${linkStyle("/teacher/question-paper")}`} onClick={() => setOpen(false)}>
            Question Paper
          </Link>
        </nav>

        <div className="mt-6 border-t border-(--border) pt-5 md:hidden">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.18),rgba(190,24,93,0.18))] px-4 py-3 text-sm font-semibold text-red-100 shadow-[0_14px_32px_rgba(15,23,42,0.32)] transition hover:border-red-300/30 hover:bg-[linear-gradient(135deg,rgba(239,68,68,0.24),rgba(190,24,93,0.24))]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col">
        <header className="border-b border-(--border) bg-(--bg-card) px-4 py-4 md:px-8">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="text-base font-semibold text-(--text-main) truncate">
              {school?.name || "Teacher Panel"}
            </h2>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-xl border border-(--border) bg-white/5 px-3 py-2 text-sm text-(--text-main) hover:bg-white/10"
            >
              Menu
            </button>
          </div>

          <div className="mt-4 hidden items-center justify-between md:flex">
            <div>
              <h2 className="text-base font-semibold text-(--text-main) md:text-lg">
                Teacher Panel
              </h2>
              <p className="text-xs text-(--text-muted)">
                {school?.subdomain ? `${school.subdomain}.naysha.online` : ""}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <p className="text-sm text-(--text-muted)">Welcome, {teacherName}</p>
              <button
                onClick={logout}
                className="rounded-full border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.88),rgba(190,24,93,0.88))] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:brightness-110"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-(--bg-main) p-4 pb-28 md:p-10 md:pb-10">
          <div className="page-enter">{children}</div>
        </main>

        <nav className="fixed inset-x-4 bottom-4 z-30 rounded-[28px] border border-(--border) bg-(--bg-card) p-2 shadow-[0_24px_70px_rgba(2,8,23,0.5)] backdrop-blur md:hidden">
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
