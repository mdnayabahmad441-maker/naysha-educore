"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { getUserRole } from "@/lib/getUserRole"
import { useSchool } from "@/context/SchoolContext"

export default function TeacherLayout({ children }: { children: React.ReactNode }) {

  const router = useRouter()
  const pathname = usePathname()
  const school = useSchool()

  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const checkAuth = async () => {

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        window.location.href = "/login"
        return
      }

      const roleData = await getUserRole()

      if (!roleData) {
        window.location.href = "/login"
        return
      }

      // 🔥 ONLY TEACHER ALLOWED
      if (roleData.role !== "teacher") {
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
          {school?.name || "Teacher Panel"}
        </h1>

        <nav className="flex flex-col gap-1 text-sm">

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

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        <header className="flex justify-between items-center px-8 py-4 bg-[#0b1a33] border-b border-white/10">

          <div>
            <h2 className="text-lg font-semibold">
              Teacher Panel
            </h2>

            <p className="text-xs text-gray-400">
              {school?.subdomain ? `${school.subdomain}.naysha.online` : ""}
            </p>
          </div>

          <button
            onClick={logout}
            className="bg-red-600 px-4 py-2 rounded-md text-sm"
          >
            Logout
          </button>

        </header>

        <main className="flex-1 p-10">
          {children}
        </main>

      </div>

    </div>
  )
}