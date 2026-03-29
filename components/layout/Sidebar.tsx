"use client"

import Link from "next/link"

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 p-6 text-white min-h-screen">
      <h2 className="text-xl font-bold mb-6">NaySha EduCore</h2>

      <nav className="flex flex-col gap-3">

        <Link href="/admin/dashboard">Dashboard</Link>

        <h3 className="mt-4 text-sm opacity-70">Academics</h3>
        <Link href="/admin/students">Students</Link>
        <Link href="/admin/teachers">Teachers</Link>
        <Link href="/admin/classes">Classes</Link>
        <Link href="/admin/subjects">Subjects</Link>

        <h3 className="mt-4 text-sm opacity-70">Attendance</h3>
        <Link href="/admin/attendance">Attendance</Link>

        <h3 className="mt-4 text-sm opacity-70">Examinations</h3>
        <Link href="/admin/exams">Create Exam</Link>
        <Link href="/admin/exams/marks">Marks Entry</Link>
        <Link href="/admin/exams/results">Results</Link>

        <h3 className="mt-4 text-sm opacity-70">Finance</h3>
        <Link href="/admin/fees">Fees</Link>
        <Link href="/admin/payments">Payments</Link>

        <Link href="/admin/reports">Reports</Link>
        <Link href="/admin/settings">Settings</Link>

      </nav>
    </div>
  )
}