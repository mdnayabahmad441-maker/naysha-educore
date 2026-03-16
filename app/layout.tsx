"use client"

import { useState } from "react"
import Link from "next/link"
import "./globals.css"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [open,setOpen] = useState(false)

  return (

    <div className="flex min-h-screen bg-[#020c1b] text-white">

      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 px-3 py-2 rounded"
        onClick={()=>setOpen(!open)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside
        className={`bg-[#0f172a] w-64 p-6 space-y-4 fixed lg:static h-full z-40 transition-transform
        ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >

        <h1 className="text-xl font-bold mb-6">
          NaySha EduCore
        </h1>

        <nav className="space-y-3 text-sm">

          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/students">Students</Link>
          <Link href="/admin/teachers">Teachers</Link>
          <Link href="/admin/classes">Classes</Link>
          <Link href="/admin/subjects">Subjects</Link>
          <Link href="/admin/attendance">Attendance</Link>
          <Link href="/admin/exams">Exams</Link>
          <Link href="/admin/fees">Fees</Link>
          <Link href="/admin/reports">Reports</Link>
          <Link href="/admin/settings">Settings</Link>

        </nav>

      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-0 p-6 w-full">

        {/* Topbar */}
        <div className="flex justify-end mb-6">
          <button className="bg-red-600 px-4 py-2 rounded">
            Logout
          </button>
        </div>

        {children}

      </main>

    </div>

  )
}