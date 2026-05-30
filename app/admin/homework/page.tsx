"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"

type HW = {
  id: string
  title: string
  subject: string
  description: string | null
  due_date: string
  class_id: string
  classes: { name: string } | null
  teacher_name: string | null
  created_at: string
}

function dueBadge(dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.round((new Date(dueDate).getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { label: "Overdue",      cls: "bg-red-400/15 text-red-300 border-red-400/20" }
  if (diff === 0) return { label: "Due today",    cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
  return { label: new Date(dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }), cls: "bg-slate-400/15 text-slate-300 border-slate-400/20" }
}

export default function AdminHomeworkPage() {
  const [classes,   setClasses]   = useState<{ id: string; name: string }[]>([])
  const [homework,  setHomework]  = useState<HW[]>([])
  const [loading,   setLoading]   = useState(true)
  const [classFilter, setClassFilter] = useState("")

  useEffect(() => {
    getSchoolId().then(async (id) => {
      if (!id) return
      const { data } = await supabase.from("classes").select("id,name").eq("school_id", id).order("name")
      setClasses(data || [])
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (classFilter) params.set("classId", classFilter)
      const res  = await apiFetch(`/api/homework?${params}`)
      const data = await res.json()
      setHomework(res.ok ? (data.homework ?? []) : [])
    } finally {
      setLoading(false)
    }
  }, [classFilter])

  useEffect(() => { void load() }, [load])

  async function deleteHW(id: string) {
    if (!confirm("Delete this homework?")) return
    await apiFetch(`/api/homework/${id}`, { method: "DELETE" })
    setHomework(prev => prev.filter(h => h.id !== id))
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-white md:p-10">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homework</h1>
          <p className="mt-1 text-sm text-slate-400">{homework.length} assignments</p>
        </div>
        <select
          value={classFilter}
          onChange={e => setClassFilter(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white"
        >
          <option value="">All Classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : homework.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] py-12 text-center text-slate-400">
          No homework found.
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map(hw => {
            const badge = dueBadge(hw.due_date)
            return (
              <div key={hw.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
                        {hw.classes?.name || "—"}
                      </span>
                      <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{hw.subject}</span>
                      <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-white">{hw.title}</h3>
                    {hw.description && (
                      <p className="mt-1 text-sm text-slate-400 leading-relaxed">{hw.description}</p>
                    )}
                    {hw.teacher_name && (
                      <p className="mt-2 text-xs text-slate-500">Assigned by {hw.teacher_name}</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHW(hw.id)}
                    className="shrink-0 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
