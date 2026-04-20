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

  if (loading) {
    return (
      <div className="p-10 text-white bg-[var(--bg-main)] min-h-screen flex items-center justify-center">
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

    <div className="flex min-h-screen bg-[var(--bg-main)] text-white">

      {/* 🔥 SIDEBAR */}
      <aside className="w-64 bg-[var(--bg-card)] border-r border-white/10 p-6 flex flex-col">

        <h1 className="text-xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          {school?.name || "NaySha EduCore"}
        </h1>

        <nav className="flex flex-col gap-2 text-sm">

          <Link href="/admin" className={linkStyle("/admin")}>
            📊 Dashboard
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Academics</p>

          <Link href="/admin/students" className={linkStyle("/admin/students")}>
            👨‍🎓 Students
          </Link>

          <Link href="/admin/students/id-cards" className={linkStyle("/admin/students/id-cards")}> 
            🪪 ID Cards
          </Link>

          <Link href="/admin/classes" className={linkStyle("/admin/classes")}>
            🏫 Classes
          </Link>

          <Link href="/admin/subjects" className={linkStyle("/admin/subjects")}>
            📚 Subjects
          </Link>

          <Link href="/admin/admission-enquiry" className={linkStyle("/admin/admission-enquiry")}>
            📝 Admission Enquiry
          </Link>

          <Link href="/admin/promotion" className={linkStyle("/admin/promotion")}>
            🔁 Promotion
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Attendance</p>

          <Link href="/admin/attendance" className={linkStyle("/admin/attendance")}>
            📅 Attendance
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Examinations</p>

          <Link href="/admin/exams/create" className={linkStyle("/admin/exams/create")}>
            📝 Create Exam
          </Link>

          <Link href="/admin/exams/marks" className={linkStyle("/admin/exams/marks")}>
            ✏️ Marks Entry
          </Link>

          <Link href="/admin/exams/result" className={linkStyle("/admin/exams/result")}>
            📄 Results
          </Link>

          <Link href="/admin/exams/reportcard" className={linkStyle("/admin/exams/reportcard")}>
            📑 Report Cards
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Finance</p>

          <Link href="/admin/fees" className={linkStyle("/admin/fees")}>
            💰 Fees
          </Link>

          <Link href="/admin/payments" className={linkStyle("/admin/payments")}>
            💳 Payments
          </Link>

          <Link href="/admin/reports" className={linkStyle("/admin/reports")}>
            📈 Reports
          </Link>

          {/* 🔥 UPDATED COMMUNICATION SECTION */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">Communication</p>

          <Link href="/admin/notices" className={linkStyle("/admin/notices")}>
            📢 Notices
          </Link>

          {/* ✅ NEW EVENTS PAGE */}
          <Link href="/admin/events" className={linkStyle("/admin/events")}>
            📅 Events
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">System</p>

          <Link href="/admin/settings" className={linkStyle("/admin/settings")}>
            ⚙️ Settings
          </Link>

        </nav>

      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        <header className="flex justify-between items-center px-8 py-4 border-b border-white/10 bg-[var(--bg-card)]">

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
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90"
          >
            Logout
          </button>

        </header>

        <main className="flex-1 p-10 bg-[var(--bg-main)]">
          {children}
        </main>

      </div>

    </div>
  )
}