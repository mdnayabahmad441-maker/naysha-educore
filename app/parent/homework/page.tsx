"use client"

import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

type HW = {
  id: string
  title: string
  subject: string
  description: string | null
  due_date: string
  teacher_name: string | null
  class_id: string
  className?: string
  questions?: string | null
}

function dueBadge(dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.round((new Date(dueDate).getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { label: "Overdue",      cls: "bg-red-400/15 text-red-300 border-red-400/20" }
  if (diff === 0) return { label: "Due today",    cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
  if (diff === 1) return { label: "Due tomorrow", cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
  return {
    label: new Date(dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }),
    cls: "bg-slate-400/15 text-slate-300 border-slate-400/20"
  }
}

export default function ParentHomeworkPage() {
  const [homework, setHomework] = useState<HW[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const studentIds = await getCurrentParentStudentIds()
        if (!studentIds.length) { setError("No student linked to your account."); return }

        // Get class IDs for the student(s)
        const { data: enrollments } = await supabase
          .from("student_enrollments")
          .select("class_id, school_id")
          .in("student_id", studentIds)

        if (!enrollments?.length) { setHomework([]); return }

        const classIds  = [...new Set(enrollments.map(e => e.class_id).filter(Boolean))]
        const schoolIds = [...new Set(enrollments.map(e => e.school_id).filter(Boolean))]

        const { data, error: hwErr } = await supabase
          .from("homework")
          .select("id, title, subject, description, due_date, teacher_name, class_id, questions")
          .in("class_id", classIds)
          .in("school_id", schoolIds)
          .gte("due_date", new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)) // last 7 days + upcoming
          .order("due_date", { ascending: true })

        if (hwErr) throw hwErr

        // Attach class names
        const classNameMap: Record<string, string> = {}
        const allClassIds = [...new Set((data || []).map((h: any) => h.class_id).filter(Boolean))]
        if (allClassIds.length) {
          const { data: cls } = await supabase.from("classes").select("id,name").in("id", allClassIds)
          cls?.forEach((c: any) => { classNameMap[c.id] = c.name })
        }

        setHomework((data || []).map((h: any) => ({ ...h, className: classNameMap[h.class_id] || null })))
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load homework")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  if (loading) return <div className="py-10 text-center text-slate-400">Loading…</div>
  if (error)   return <div className="py-10 text-center text-red-400">{error}</div>

  const overdue  = homework.filter(h => new Date(h.due_date) < new Date(new Date().toDateString()))
  const upcoming = homework.filter(h => new Date(h.due_date) >= new Date(new Date().toDateString()))

  return (
    <div className="space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold">Homework</h1>
        <p className="mt-1 text-sm text-slate-400">{upcoming.length} upcoming · {overdue.length} overdue</p>
      </div>

      {homework.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] py-12 text-center text-slate-400">
          No homework assigned yet.
        </div>
      )}

      {overdue.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-400">Overdue</p>
          {overdue.map(hw => <HomeworkCard key={hw.id} hw={hw} />)}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Upcoming</p>
          {upcoming.map(hw => <HomeworkCard key={hw.id} hw={hw} />)}
        </div>
      )}
    </div>
  )
}

function HomeworkCard({ hw }: { hw: HW }) {
  const badge = dueBadge(hw.due_date)
  const [showQ, setShowQ] = useState(false)
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1a33] p-5">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {hw.className && (
          <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            {hw.className}
          </span>
        )}
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{hw.subject}</span>
        <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
        {hw.questions && (
          <span className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-xs font-semibold text-purple-300">✦ Questions Attached</span>
        )}
      </div>
      <h3 className="font-semibold text-white">{hw.title}</h3>
      {hw.description && <p className="mt-1.5 text-sm text-slate-400 leading-relaxed">{hw.description}</p>}
      <div className="mt-2 flex items-center justify-between">
        {hw.teacher_name && <p className="text-xs text-slate-500">By {hw.teacher_name}</p>}
        {hw.questions && (
          <button
            onClick={() => setShowQ(v => !v)}
            className="rounded-lg border border-purple-400/20 px-3 py-1 text-xs text-purple-400 hover:bg-purple-400/10"
          >
            {showQ ? "Hide Questions" : "View Questions"}
          </button>
        )}
      </div>
      {showQ && hw.questions && (
        <div className="mt-3 rounded-xl border border-purple-400/10 bg-purple-400/5 p-4">
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">{hw.questions}</pre>
        </div>
      )}
    </div>
  )
}
