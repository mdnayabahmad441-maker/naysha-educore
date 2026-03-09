"use client"

import Link from "next/link"

export default function Dashboard() {

  return (

    <div className="min-h-screen flex bg-slate-950 text-white">

      {/* SIDEBAR */}

      <aside className="w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-6">

        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          NaySha EduCore
        </h1>

        <nav className="space-y-4">

          <Link
            href="/erp/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Dashboard
          </Link>

          <Link
            href="/erp/dashboard/students"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Students
          </Link>

          <Link
            href="/erp/dashboard/teachers"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Teachers
          </Link>

          <Link
            href="/erp/dashboard/attendance"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Attendance
          </Link>

          <Link
            href="/erp/dashboard/fees"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Fees
          </Link>

          <Link
            href="/erp/dashboard/exams"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Exams
          </Link>

          <Link
            href="/erp/dashboard/reports"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Reports
          </Link>

          <Link
            href="/erp/dashboard/settings"
            className="block px-4 py-2 rounded-lg hover:bg-white/10"
          >
            Settings
          </Link>

        </nav>

      </aside>


      {/* MAIN CONTENT */}

      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          Dashboard Overview
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">
              Total Students
            </p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              0
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">
              Teachers
            </p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              0
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">
              Fees Collected
            </p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹0
            </h3>
          </div>

        </div>

      </main>

    </div>

  )
}