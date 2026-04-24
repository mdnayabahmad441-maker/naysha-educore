"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentTeacher } from "@/lib/role-access"

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      const teacherData = await getCurrentTeacher()

      if (!teacherData) {
        alert("Teacher not found")
        setLoading(false)
        return
      }

      setTeacher(teacherData)
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return <div className="p-6 text-white md:p-10">Loading...</div>
  }

  const quickLinks = [
    {
      href: "/teacher/attendance",
      title: "Take Attendance",
      text: "Open the class register and mark students quickly.",
    },
    {
      href: "/teacher/marks",
      title: "Enter Marks",
      text: "Update subject marks with fewer taps on mobile.",
    },
    {
      href: "/teacher/students",
      title: "Students",
      text: "Find class students and review their records.",
    },
    {
      href: "/teacher/exams",
      title: "Create Exam",
      text: "Plan new assessments without leaving the panel.",
    },
  ]

  return (
    <div className="space-y-6 p-4 text-white md:p-10">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),linear-gradient(135deg,rgba(11,26,51,0.96),rgba(8,15,30,0.92))] p-6 shadow-[0_26px_80px_rgba(2,8,23,0.45)] md:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200/70">
          Teacher Overview
        </p>
        <h1 className="mt-3 text-2xl font-bold md:text-4xl">
          Welcome back, {teacher.name}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
          Your mobile workspace is tuned for faster class handling, quick attendance, and smoother marks entry.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Subject
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {teacher.subject || "Not assigned"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              School
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {teacher.school_id ? "Connected" : "Pending"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4 sm:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Access
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              Mobile Ready
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <p className="text-sm text-slate-400">
              Tap once and continue working without digging through menus.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_48px_rgba(2,8,23,0.24)] transition hover:border-cyan-300/20 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(255,255,255,0.04))]"
            >
              <h3 className="text-lg font-semibold text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {item.text}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
