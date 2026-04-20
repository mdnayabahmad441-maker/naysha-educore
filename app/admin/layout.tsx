"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useSchool } from "@/context/SchoolContext"
import { getUserRole } from "@/lib/getUserRole"

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {

    let retryCount = 0

    const checkAuth = async () => {

      const { data: userData } = await supabase.auth.getUser()

      if (!userData?.user) {
        window.location.href = "/login"
        return
      }

      const roleData = await getUserRole()

      if (!roleData) {
        if (retryCount < 5) {
          retryCount++
          setTimeout(checkAuth, 400)
          return
        } else {
          window.location.href = "/login"
          return
        }
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
      <div className="p-6 text-white bg-(--bg-main) min-h-screen flex items-center justify-center">
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

    <div className="flex min-h-screen flex-col bg-(--bg-main) text-white md:flex-row">

      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`fixed inset-0 z-30 bg-black/60 transition-opacity duration-200 md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`} onClick={closeSidebar} />

      {/* 🔥 SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-full max-w-[320px] transform border-r border-white/10 bg-(--bg-card) p-6 transition-transform duration-200 md:static md:translate-x-0 md:w-64 md:max-w-none ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>

        <div className="flex items-center justify-between gap-4 md:block">
          <h1 className="text-xl font-bold mb-6 bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {school?.name || "NaySha EduCore"}
          </h1>
          <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5 md:hidden" onClick={closeSidebar}>
            Close
          </button>
        </div>

        <nav className="flex flex-col gap-2 text-sm">

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

          <Link href="/admin/settings" className={linkStyle("/admin/settings")} onClick={closeSidebar}>
            ⚙️ Settings
          </Link>

        </nav>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col md:ml-64">

        <header className="flex flex-col gap-4 px-4 py-4 border-b border-white/10 bg-(--bg-card) md:flex-row md:items-center md:px-8">
          <div className="flex items-center justify-between gap-4 md:hidden">
            <div>
              <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
            </div>
            <button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white hover:bg-white/5" onClick={() => setSidebarOpen(true)}>
              Menu
            </button>
          </div>

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
            className="px-4 py-2 rounded-lg text-sm font-medium bg-linear-to-r from-red-500 to-pink-500 hover:opacity-90"
          >
            Logout
          </button>

        </header>

        <main className="flex-1 p-4 bg-(--bg-main) md:p-10">
          {children}
        </main>

      </div>

    </div>
  )
}