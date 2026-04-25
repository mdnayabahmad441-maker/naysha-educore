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

      const roleData = await getUserRole()

      if (!roleData) {
        window.location.href = "/login"
        return
      }

      if (roleData.role !== "admin") {
        window.location.href = "/unauthorized"
        return
      }

      setLoading(false)
    }

    checkAuth()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          window.location.href = "/login"
        }
      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const closeSidebar = () => setSidebarOpen(false)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-(--bg-main) p-6 text-white">
        Loading...
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
      pathname === path || pathname.startsWith(path + "/")
        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`

  return (

    <div className="flex h-screen flex-col overflow-hidden bg-(--bg-main) text-white md:flex-row">

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-200 md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={closeSidebar} />

      {/* 🔥 SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex h-full w-full max-w-[320px] flex-col overflow-hidden border-r border-white/10 bg-(--bg-card) p-6 transition-transform duration-200 md:static md:translate-x-0 md:w-64 md:max-w-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

        <div className="flex items-center justify-between gap-4 md:block">
          <h1 className="text-xl font-bold mb-6 bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {school?.name || "NaySha EduCore"}
          </h1>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden" onClick={closeSidebar}>
            Close
          </button>
        </div>

        <nav className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-1 text-sm pb-6">

          <Link href="/admin" className={linkStyle("/admin")} onClick={closeSidebar}>
            📊 Dashboard
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Academics</p>

<Link href="/admin/students" className={linkStyle("/admin/students")} onClick={closeSidebar}> 
            👨‍🎓 Students
          </Link>

          <Link href="/admin/students/id-cards" className={linkStyle("/admin/students/id-cards")} onClick={closeSidebar}> 
            🪪 ID Cards
          </Link>

          <Link href="/admin/classes" className={linkStyle("/admin/classes")} onClick={closeSidebar}> 
            🏫 Classes
          </Link>

          <Link href="/admin/subjects" className={linkStyle("/admin/subjects")} onClick={closeSidebar}>
            📚 Subjects
          </Link>

          <Link href="/admin/teachers" className={linkStyle("/admin/teachers")} onClick={closeSidebar}>
            👨‍🏫 Teachers
          </Link>

          <Link href="/admin/admission-enquiry" className={linkStyle("/admin/admission-enquiry")} onClick={closeSidebar}>
            📝 Admission Enquiry
          </Link>

          <Link href="/admin/promotion" className={linkStyle("/admin/promotion")} onClick={closeSidebar}>
            🔁 Promotion
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Attendance</p>

          <Link href="/admin/attendance" className={linkStyle("/admin/attendance")} onClick={closeSidebar}>
            📅 Attendance
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Examinations</p>

          <Link href="/admin/exams/create" className={linkStyle("/admin/exams/create")} onClick={closeSidebar}>
            📝 Create Exam
          </Link>

          <Link href="/admin/exams/marks" className={linkStyle("/admin/exams/marks")} onClick={closeSidebar}>
            ✏️ Marks Entry
          </Link>

          <Link href="/admin/exams/result" className={linkStyle("/admin/exams/result")} onClick={closeSidebar}>
            📄 Results
          </Link>

          <Link href="/admin/exams/reportcard" className={linkStyle("/admin/exams/reportcard")} onClick={closeSidebar}>
            📑 Report Cards
          </Link>

          <Link href="/admin/documents/certificates" className={linkStyle("/admin/documents/certificates")} onClick={closeSidebar}>
            🏅 Certificates / TC
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Finance</p>

          <Link href="/admin/fees" className={linkStyle("/admin/fees")} onClick={closeSidebar}>
            💰 Fees
          </Link>

          <Link href="/admin/payments" className={linkStyle("/admin/payments")} onClick={closeSidebar}>
            💳 Payments
          </Link>

          <Link href="/admin/reports" className={linkStyle("/admin/reports")} onClick={closeSidebar}>
            📈 Reports
          </Link>

          {/* 🔥 UPDATED COMMUNICATION SECTION */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Communication</p>

          <Link href="/admin/notices" className={linkStyle("/admin/notices")} onClick={closeSidebar}>
            📢 Notices
          </Link>

          {/* ✅ NEW EVENTS PAGE */}
          <Link href="/admin/events" className={linkStyle("/admin/events")} onClick={closeSidebar}>
            📅 Events
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">System</p>

          <Link href="/admin/import" className={linkStyle("/admin/import")} onClick={closeSidebar}>
            📥 Bulk Import
          </Link>

          <Link href="/admin/settings" className={linkStyle("/admin/settings")} onClick={closeSidebar}>
            ⚙️ Settings
          </Link>

          <Link href="/admin/documents" className={linkStyle("/admin/documents")} onClick={closeSidebar}>
            📄 Document Studio
          </Link>

          <Link href="/admin/ai-assistant" className={linkStyle("/admin/ai-assistant")} onClick={closeSidebar}>
            🤖 AI Assistant
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

      {/* MAIN */}
      <div className="flex min-h-0 flex-1 flex-col md:ml-64">

        <header className="border-b border-white/10 bg-(--bg-card) px-4 py-4 md:px-8">
          <div className="md:hidden">
            <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_38%),linear-gradient(135deg,rgba(10,17,32,0.96),rgba(7,12,22,0.9))] px-4 py-4 shadow-[0_24px_60px_rgba(2,8,23,0.42)]">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-200/70">
                    Workspace
                  </p>
                  <h2 className="mt-2 truncate text-lg font-semibold text-white">Admin Panel</h2>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    Admissions, fees, attendance, and operations in one place.
                  </p>
                </div>
                <button type="button" className="shrink-0 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white shadow-[0_12px_28px_rgba(15,23,42,0.28)] hover:bg-white/10" onClick={() => setSidebarOpen(true)}>
                  Menu
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs">
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-medium text-emerald-100">
                  Secure Access
                </span>
                <span className="truncate rounded-full border border-white/10 bg-white/6 px-3 py-1 text-slate-300">
                  {school?.subdomain ? `${school.subdomain}.naysha.online` : "ERP Workspace"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 hidden items-center justify-between gap-4 md:flex">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Admin Panel
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

        <main className="flex-1 overflow-y-auto bg-(--bg-main) p-4 md:p-10">
          {children}
        </main>

      </div>

    </div>
  )
}
