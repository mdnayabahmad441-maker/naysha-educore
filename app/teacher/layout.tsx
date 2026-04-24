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
  const [open, setOpen] = useState(false) // 🔥 MOBILE SIDEBAR

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
      <div className="flex items-center justify-center min-h-screen bg-[#020c1b] text-white">
        Loading...
      </div>
    )
  }

  const linkStyle = (path: string) =>
    `flex items-center gap-3 px-3 py-3 rounded-md transition ${
      pathname.startsWith(path)
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-white/10 hover:text-white"
    }`

  return (

    <div className="flex min-h-screen bg-[#020c1b] text-white">

      {/* ================= MOBILE OVERLAY ================= */}
      {open && (
        <div
          onClick={()=>setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`
        fixed md:static z-50
        w-64 h-full
        bg-[#0b1a33] border-r border-white/10 p-6 flex flex-col
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>

        <h1 className="text-lg md:text-xl font-bold mb-8">
          {school?.name || "Teacher Panel"}
        </h1>

        <nav className="flex flex-col gap-2 text-sm">

          <Link href="/teacher" className={linkStyle("/teacher")}>
            📊 Dashboard
          </Link>

          <p className="text-gray-500 text-xs mt-6 mb-2 uppercase">
            Academics
          </p>

          <Link href="/teacher/students" className={linkStyle("/teacher/students")}>
            👨‍🎓 Students
          </Link>

          <Link href="/teacher/attendance" className={linkStyle("/teacher/attendance")}>
            📅 Attendance
          </Link>

          <Link href="/teacher/exams" className={linkStyle("/teacher/exams")}>
            📝 Create Exam
          </Link>

          <Link href="/teacher/marks" className={linkStyle("/teacher/marks")}>
            ✏️ Enter Marks
          </Link>

        </nav>

      </aside>

      {/* ================= MAIN ================= */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="flex justify-between items-center px-4 md:px-8 py-4 bg-[#0b1a33] border-b border-white/10">

          {/* LEFT */}
          <div className="flex items-center gap-3">

            {/* 🔥 MENU BUTTON (MOBILE) */}
            <button
              onClick={()=>setOpen(true)}
              className="md:hidden text-xl"
            >
              ☰
            </button>

            <div>
              <h2 className="text-base md:text-lg font-semibold">
                Teacher Panel
              </h2>

              <p className="text-xs text-gray-400">
                {school?.subdomain ? `${school.subdomain}.naysha.online` : ""}
              </p>
            </div>

          </div>

          {/* RIGHT */}
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-3 md:px-4 py-2 rounded-md text-xs md:text-sm"
          >
            Logout
          </button>

        </header>

        {/* CONTENT */}
        <main className="flex-1 p-4 md:p-10">
          {children}
        </main>

      </div>

    </div>
  )
}
