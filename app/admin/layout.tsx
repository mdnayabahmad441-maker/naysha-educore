"use client"

import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-slate-950 text-white">

      {/* SIDEBAR */}

      <aside className="w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-6">

        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          NaySha EduCore
        </h1>

        <nav className="space-y-4">

          <Link href="/admin/dashboard" className="block hover:text-cyan-400">
            Dashboard
          </Link>

          <Link href="/admin/students" className="block hover:text-cyan-400">
            Students
          </Link>

          <Link href="/admin/teachers" className="block hover:text-cyan-400">
            Teachers
          </Link>

          <Link href="/admin/attendance" className="block hover:text-cyan-400">
            Attendance
          </Link>

          <Link href="/admin/exams" className="block hover:text-cyan-400">
            Exams
          </Link>

          <Link href="/admin/fees" className="block hover:text-cyan-400">
            Fees
          </Link>

          <Link href="/admin/reports" className="block hover:text-cyan-400">
            Reports
          </Link>

          <Link href="/admin/settings" className="block hover:text-cyan-400">
            Settings
          </Link>
          
          <Link href="/admin/subjects">Subjects</Link>
          

        </nav>

      </aside>

      {/* MAIN */}

      <main className="flex-1 p-10">
        {children}
      </main>

    </div>
  )
}