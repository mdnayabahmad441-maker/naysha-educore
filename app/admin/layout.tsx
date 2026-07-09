"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { waitForUser } from "@/lib/auth-session"
import { useSchool } from "@/context/SchoolContext"
import { getUserRole } from "@/lib/getUserRole"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await waitForUser()

      if (!user) {
        window.location.href = "/login"
        return
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 600))
        const roleData = await getUserRole()
        if (roleData?.role === "admin") {
          setLoading(false)
          return
        }
        if (attempt === 2) {
          await supabase.auth.refreshSession()
          const retryRole = await getUserRole()
          if (retryRole?.role === "admin") {
            setLoading(false)
            return
          }
        }
      }

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

  const closeSidebar = () => setSidebarOpen(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main) p-6 text-white">
        <div className="spinner" />
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex min-w-0 items-center gap-3 rounded-lg px-4 py-2 transition-all duration-200 ${
      pathname === path || pathname.startsWith(path + "/")
        ? "nav-link-active"
        : "nav-link-inactive"
    }`

  return (
    <div className="theme-dashboard flex h-screen min-w-0 flex-col overflow-hidden bg-(--bg-main) text-(--text-main) md:flex-row">
      <div
        className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-200 md:hidden ${sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={closeSidebar}
      />

      <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-[88vw] max-w-[320px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-(--bg-card) p-4 transition-transform duration-200 sm:p-6 md:static md:w-64 md:max-w-none md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between gap-4 md:block">
          <h1 className="mb-6 break-words bg-linear-to-r from-(--color-accent) to-(--color-accent-2) bg-clip-text text-xl font-bold leading-tight text-transparent">
            {school?.name || "NaySha EduCore"}
          </h1>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden" onClick={closeSidebar}>
            Close
          </button>
        </div>

        <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pb-6 pr-1 text-sm">
          <Link href="/admin" className={`nav-link ${linkStyle("/admin")}`} onClick={closeSidebar}>Dashboard</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">Academics</p>
          <Link href="/admin/students" className={`nav-link ${linkStyle("/admin/students")}`} onClick={closeSidebar}>Students</Link>
          <Link href="/admin/students/id-cards" className={`nav-link ${linkStyle("/admin/students/id-cards")}`} onClick={closeSidebar}>ID Cards</Link>
          <Link href="/admin/classes" className={`nav-link ${linkStyle("/admin/classes")}`} onClick={closeSidebar}>Classes</Link>
          <Link href="/admin/subjects" className={`nav-link ${linkStyle("/admin/subjects")}`} onClick={closeSidebar}>Subjects</Link>
          <Link href="/admin/teachers" className={`nav-link ${linkStyle("/admin/teachers")}`} onClick={closeSidebar}>Teachers</Link>
          <Link href="/admin/teacher-attendance" className={`nav-link ${linkStyle("/admin/teacher-attendance")}`} onClick={closeSidebar}>Teacher Attendance</Link>
          <Link href="/admin/admissions" className={`nav-link ${linkStyle("/admin/admissions")}`} onClick={closeSidebar}>Admissions</Link>
          <Link href="/admin/admission-enquiry" className={`nav-link ${linkStyle("/admin/admission-enquiry")}`} onClick={closeSidebar}>Admission Enquiry</Link>
          <Link href="/admin/homework" className={`nav-link ${linkStyle("/admin/homework")}`} onClick={closeSidebar}>Homework</Link>
          <Link href="/admin/promotion" className={`nav-link ${linkStyle("/admin/promotion")}`} onClick={closeSidebar}>Promotion</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">Attendance</p>
          <Link href="/admin/attendance" className={`nav-link ${linkStyle("/admin/attendance")}`} onClick={closeSidebar}>Attendance</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">Examinations</p>
          <Link href="/admin/exams/create" className={`nav-link ${linkStyle("/admin/exams/create")}`} onClick={closeSidebar}>Create Exam</Link>
          <Link href="/admin/exams/marks" className={`nav-link ${linkStyle("/admin/exams/marks")}`} onClick={closeSidebar}>Marks Entry</Link>
          <Link href="/admin/exams/result" className={`nav-link ${linkStyle("/admin/exams/result")}`} onClick={closeSidebar}>Results</Link>
          <Link href="/admin/exams/reportcard" className={`nav-link ${linkStyle("/admin/exams/reportcard")}`} onClick={closeSidebar}>Report Cards</Link>
          <Link href="/admin/documents/certificates" className={`nav-link ${linkStyle("/admin/documents/certificates")}`} onClick={closeSidebar}>Certificates / TC</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">Finance</p>
          <Link href="/admin/fees" className={`nav-link ${linkStyle("/admin/fees")}`} onClick={closeSidebar}>Fees</Link>
          <Link href="/admin/payments" className={`nav-link ${linkStyle("/admin/payments")}`} onClick={closeSidebar}>Payments</Link>
          <Link href="/admin/reports" className={`nav-link ${linkStyle("/admin/reports")}`} onClick={closeSidebar}>Reports</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">Communication</p>
          <Link href="/admin/notices" className={`nav-link ${linkStyle("/admin/notices")}`} onClick={closeSidebar}>Notices</Link>
          <Link href="/admin/events" className={`nav-link ${linkStyle("/admin/events")}`} onClick={closeSidebar}>Events</Link>

          <p className="mb-2 mt-6 text-xs uppercase text-gray-500">System</p>
          <Link href="/admin/settings" className={`nav-link ${linkStyle("/admin/settings")}`} onClick={closeSidebar}>Settings</Link>
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

        <div className="border-t border-white/10 pt-4 text-xs text-gray-500">
          <p>NaySha EduCore</p>
          <p className="mt-1">Powered by <span className="font-semibold text-gray-300">Groenics</span></p>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="border-b border-white/10 bg-(--bg-card) px-4 py-4 md:px-8">
          <div className="flex items-center justify-between md:hidden">
            <h2 className="text-base font-semibold text-white truncate">
              {school?.name || "Admin Panel"}
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10"
            >
              Menu
            </button>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
              <p className="truncate text-xs text-gray-400">{school?.subdomain ? `${school.subdomain}.naysha.online` : ""}</p>
            </div>

            <button
              onClick={logout}
              className="rounded-full border border-red-400/20 bg-[linear-gradient(135deg,rgba(239,68,68,0.88),rgba(190,24,93,0.88))] px-5 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(127,29,29,0.28)] transition hover:brightness-110"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="theme-dashboard flex-1 overflow-y-auto bg-(--bg-main) p-4 md:p-8">
          <div className="page-enter min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}
