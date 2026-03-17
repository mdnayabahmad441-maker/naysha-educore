"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function AdminLayout({ children }: { children: React.ReactNode }) {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const checkAuth = async () => {

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace("/login")
      } else {
        setLoading(false)
      }

    }

    checkAuth()

  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  if (loading) {
    return (
      <div className="p-10 text-white bg-[#020c1b] min-h-screen">
        Checking authentication...
      </div>
    )
  }

  return (

    <div className="flex min-h-screen bg-[#020c1b] text-white">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0b1a33] p-6">

        <h1 className="text-xl font-bold mb-6">
          NaySha EduCore
        </h1>

        <nav className="space-y-4 text-gray-300">

          <Link href="/admin">Dashboard</Link>

          <div className="text-gray-500 mt-4 text-sm">
            Academics
          </div>

          <Link href="/admin/students">Students</Link>
          <Link href="/admin/teachers">Teachers</Link>
          <Link href="/admin/classes">Classes</Link>
          <Link href="/admin/subjects">Subjects</Link>

          <div className="text-gray-500 mt-4 text-sm">
            Attendance
          </div>

          <Link href="/admin/attendance">Attendance</Link>

          <div className="text-gray-500 mt-4 text-sm">
            Examinations
          </div>

          <Link href="/admin/create-exam">Create Exam</Link>
          <Link href="/admin/marks">Marks Entry</Link>
          <Link href="/admin/results">Results</Link>

          <div className="text-gray-500 mt-4 text-sm">
            Finance
          </div>

          <Link href="/admin/fees">Fees</Link>
          <Link href="/admin/payments">Payments</Link>

          <Link href="/admin/reports">Reports</Link>
          <Link href="/admin/settings">Settings</Link>

        </nav>

      </div>


      {/* MAIN CONTENT */}
      <div className="flex-1">

        {/* TOPBAR */}
        <div className="flex justify-end p-6 bg-[#0b1a33]">
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Logout
          </button>
        </div>

        {/* PAGE CONTENT */}
        <div className="p-10">
          {children}
        </div>

      </div>

    </div>

  )
}