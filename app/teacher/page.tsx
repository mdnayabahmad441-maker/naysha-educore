"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentTeacher } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

// ── Quick action cards ─────────────────────────────────────────────────────────
const ACTIONS = [
  {
    href: "/teacher/attendance",
    label: "Take Attendance",
    desc: "Mark students present or absent",
    icon: "M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
    color: "from-blue-500/20 to-blue-600/10 border-blue-400/20 hover:border-blue-400/40",
    dot: "bg-blue-400",
  },
  {
    href: "/teacher/marks",
    label: "Enter Marks",
    desc: "Update student scores and grades",
    icon: "M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z",
    color: "from-violet-500/20 to-violet-600/10 border-violet-400/20 hover:border-violet-400/40",
    dot: "bg-violet-400",
  },
  {
    href: "/teacher/students",
    label: "My Students",
    desc: "View class list and student details",
    icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75",
    color: "from-cyan-500/20 to-cyan-600/10 border-cyan-400/20 hover:border-cyan-400/40",
    dot: "bg-cyan-400",
  },
  {
    href: "/teacher/exams",
    label: "Create Exam",
    desc: "Set up a new test or assessment",
    icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
    color: "from-amber-500/20 to-amber-600/10 border-amber-400/20 hover:border-amber-400/40",
    dot: "bg-amber-400",
  },
  {
    href: "/teacher/my-attendance",
    label: "My Attendance",
    desc: "Check in / check out for today",
    icon: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-400/20 hover:border-emerald-400/40",
    dot: "bg-emerald-400",
  },
  {
    href: "/teacher/question-paper",
    label: "Question Paper",
    desc: "Generate AI-powered exam papers",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    color: "from-pink-500/20 to-pink-600/10 border-pink-400/20 hover:border-pink-400/40",
    dot: "bg-pink-400",
  },
]

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function todayLabel() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const [loading,  setLoading]  = useState(true)
  const [teacher,  setTeacher]  = useState<any>(null)
  const [subjects, setSubjects] = useState<string[]>([])

  useEffect(() => {
    const load = async () => {
      const teacherData = await getCurrentTeacher()
      if (!teacherData) { setLoading(false); return }
      setTeacher(teacherData)

      const { data: ts } = await supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_id", teacherData.id)

      if (ts?.length) {
        const { data: subData } = await supabase
          .from("subjects")
          .select("name")
          .in("id", ts.map(t => t.subject_id))
        if (subData) setSubjects(subData.map(s => s.name))
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-red-400">Teacher not found. Please contact your administrator.</p>
        <button onClick={() => window.location.href = "/login"}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white">
          Back to Login
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">

      {/* ── Greeting ── */}
      <div>
        <p className="text-sm text-(--text-muted)">{todayLabel()}</p>
        <h1 className="mt-1 text-2xl font-bold text-white md:text-3xl">
          {greeting()}, {teacher.name.split(" ")[0]} 👋
        </h1>

        {/* Subject pills */}
        {subjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {subjects.map(s => (
              <span key={s} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-(--text-muted)">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-(--text-muted)">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ACTIONS.map(action => (
            <Link
              key={action.href}
              href={action.href}
              className={`group flex flex-col gap-3 rounded-2xl border bg-linear-to-br p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg ${action.color}`}
            >
              <div className="flex items-start justify-between">
                <div className={`h-2 w-2 rounded-full ${action.dot}`} />
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
                  className="text-white/40 transition group-hover:text-white/70">
                  <path d={action.icon} />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{action.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-(--text-muted)">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
