

"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentTeacher } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState<any>(null)
  const [teacherSubjects, setTeacherSubjects] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const teacherData = await getCurrentTeacher()

      if (!teacherData) {
        console.error("Teacher not found")
        setLoading(false)
        return
      }

      setTeacher(teacherData)

      const { data: ts } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", teacherData.id)

      if (ts && ts.length > 0) {
        const subjectIds = ts.map(t => t.subject_id)
        const { data: subData } = await supabase
          .from("subjects")
          .select("name")
          .in("id", subjectIds)
        
        if (subData) {
          setTeacherSubjects(subData)
        }
      }

      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-red-400">Teacher not found. Please contact administrator.</p>
          <button 
            onClick={() => window.location.href = "/login"}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const subjectNames = teacherSubjects.map(s => s.name).join(", ")

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
      <section className="animate-scale-in overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_34%),linear-gradient(135deg,rgba(11,26,51,0.96),rgba(8,15,30,0.92))] p-6 shadow-[0_26px_80px_rgba(2,8,23,0.45)] md:p-8">
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
          <div className="stat-card animate-slide-up stagger-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Subjects
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {subjectNames || "Not assigned"}
            </p>
          </div>

          <div className="stat-card animate-slide-up stagger-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Email
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {teacher.email || "Not set"}
            </p>
          </div>

          <div className="stat-card animate-slide-up stagger-4 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 sm:col-span-2 xl:col-span-1">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Status
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              Active
            </p>
          </div>
        </div>
      </section>

      <section className="animate-slide-up stagger-3">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <p className="text-sm text-slate-400">
              Tap once and continue working without digging through menus.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {quickLinks.map((item, idx) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_48px_rgba(2,8,23,0.24)] transition hover:border-cyan-300/20 hover:bg-[linear-gradient(180deg,rgba(56,189,248,0.10),rgba(255,255,255,0.04))]`}
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
