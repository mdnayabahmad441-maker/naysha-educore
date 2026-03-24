"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useSchool } from "@/context/SchoolContext"

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const router = useRouter()
  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)

  // 🔐 AUTH CHECK (FIXED)
  useEffect(() => {

    const checkAuth = async () => {

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        window.location.href = "/login" // 🔥 HARD REDIRECT
      } else {
        setLoading(false)
      }

    }

    checkAuth()

    // 🔥 LISTEN FOR SESSION CHANGE (VERY IMPORTANT)
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

  // 🔓 LOGOUT (FIXED)
  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = "/login" // 🔥 HARD REDIRECT
  }

  if (loading) {
    return (
      <div className="p-10 text-white bg-[#020c1b] min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition ${
      pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  return (

    <div className="flex min-h-screen bg-[#020c1b] text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0b1a33] border-r border-white/10 p-6 flex flex-col">

        <h1 className="text-xl font-bold mb-8">
          {school?.name || "NaySha EduCore"}
        </h1>

        <nav className="flex flex-col gap-1 text-sm">

          <Link href="/admin" className={linkStyle("/admin")}>
            📊 Dashboard
          </Link>

          {/* ACADEMICS */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            Academics
          </p>

          <Link href="/admin/students" className={linkStyle("/admin/students")}>
            👨‍🎓 Students
          </Link>

          <Link href="/admin/teachers" className={linkStyle("/admin/teachers")}>
            👨‍🏫 Teachers
          </Link>

          <Link href="/admin/classes" className={linkStyle("/admin/classes")}>
            🏫 Classes
          </Link>

          <Link href="/admin/subjects" className={linkStyle("/admin/subjects")}>
            📚 Subjects
          </Link>

          {/* ATTENDANCE */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            Attendance
          </p>

          <Link href="/admin/attendance" className={linkStyle("/admin/attendance")}>
            📅 Attendance
          </Link>

          {/* EXAMS */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            Examinations
          </p>

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

          {/* FINANCE */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            Finance
          </p>

          <Link href="/admin/fees" className={linkStyle("/admin/fees")}>
            💰 Fees
          </Link>

          <Link href="/admin/payments" className={linkStyle("/admin/payments")}>
            💳 Payments
          </Link>

          <Link href="/admin/reports" className={linkStyle("/admin/reports")}>
            📈 Reports
          </Link>

          {/* SYSTEM */}
          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            System
          </p>

          <Link href="/admin/settings" className={linkStyle("/admin/settings")}>
            ⚙️ Settings
          </Link>

        </nav>

      </aside>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="flex justify-between items-center px-8 py-4 bg-[#0b1a33] border-b border-white/10">

          <div>
            <h2 className="text-lg font-semibold">
              Admin Panel
            </h2>

            <p className="text-xs text-gray-400">
              {school?.subdomain ? `${school.subdomain}.naysha.online` : ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-sm"
          >
            Logout
          </button>

        </header>

        {/* CONTENT */}
        <main className="flex-1 p-10">
          {children}
        </main>

      </div>

    </div>
  )
}