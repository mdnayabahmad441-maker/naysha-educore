"use client"

import { useState } from "react"
import Link from "next/link"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-950 text-white">

      {/* MOBILE MENU BUTTON */}

      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 p-3 rounded-lg shadow-lg"
      >
        ☰
      </button>


      {/* SIDEBAR */}

      <div
        className={`
        fixed md:relative
        top-0 left-0
        h-screen
        w-64
        bg-gradient-to-b from-purple-800 to-indigo-900
        p-6
        transform
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
        transition-transform duration-300
        z-40
      `}
      >
        {/* HEADER */}

        <div className="flex justify-between items-center mb-10">

          <h1 className="text-xl font-bold">
            NaySha EduCore
          </h1>

          <button
            onClick={() => setOpen(false)}
            className="md:hidden text-xl"
          >
            ✕
          </button>

        </div>

        {/* NAVIGATION */}

        <nav className="flex flex-col gap-4 text-sm">

          <Link href="/admin/dashboard">Dashboard</Link>

          <Link href="/admin/students">Students</Link>

          <Link href="/admin/teachers">Teachers</Link>

          <Link href="/admin/attendance">Attendance</Link>

          <Link href="/admin/exams">Exams</Link>

          <Link href="/admin/fees">Fees</Link>

          <Link href="/admin/reports">Reports</Link>

          <Link href="/admin/settings">Settings</Link>

          <Link href="/admin/subjects">Subjects</Link>

        </nav>
      </div>


      {/* BACKDROP (when sidebar open on mobile) */}

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 md:hidden z-30"
        />
      )}


      {/* CONTENT AREA */}

      <div className="flex-1 overflow-x-hidden">

        {/* SPACING HEADER FOR MOBILE */}

        <div className="pt-16 md:pt-0 p-4 md:p-10">

          {children}

        </div>

      </div>

    </div>
  )
}