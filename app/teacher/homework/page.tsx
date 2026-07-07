"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { useSchool } from "@/context/SchoolContext"

type HW = {
  id: string
  title: string
  subject: string
  description: string | null
  due_date: string
  class_id: string
  classes: { name: string } | null
  teacher_name: string | null
  questions: string | null
  created_at: string
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#0b1220] px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/25"

function dueBadge(dueDate: string) {
  const today = new Date(); today.setHours(0,0,0,0)
  const diff  = Math.round((new Date(dueDate).getTime() - today.getTime()) / 86400000)
  if (diff < 0)   return { label: "Overdue",      cls: "bg-red-400/15 text-red-300 border-red-400/20" }
  if (diff === 0) return { label: "Due today",    cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
  if (diff === 1) return { label: "Due tomorrow", cls: "bg-amber-400/15 text-amber-300 border-amber-400/20" }
  return { label: `Due ${new Date(dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short" })}`, cls: "bg-slate-400/15 text-slate-300 border-slate-400/20" }
}

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const

export default function TeacherHomeworkPage() {
  const school = useSchool()
  const [classes,    setClasses]    = useState<{ id: string; name: string }[]>([])
  const [homework,   setHomework]   = useState<HW[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [schoolId,   setSchoolId]   = useState<string | null>(null)
  const [expanded,   setExpanded]   = useState<string | null>(null)

  // Form fields
  const [form, setForm] = useState({ class_id: "", subject: "", title: "", description: "", due_date: "" })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // AI generation
  const [genEnabled,    setGenEnabled]    = useState(false)
  const [difficulty,    setDifficulty]    = useState<"Easy"|"Medium"|"Hard">("Medium")
  const [numQuestions,  setNumQuestions]  = useState(5)
  const [generating,    setGenerating]    = useState(false)
  const [questions,     setQuestions]     = useState("")
  const [genError,      setGenError]      = useState<string | null>(null)

  useEffect(() => {
    getSchoolId().then(async (id) => {
      if (!id) return
      setSchoolId(id)
      const { data } = await supabase.from("classes").select("id,name").eq("school_id", id).order("name")
      setClasses(data || [])
    })
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await apiFetch("/api/homework")
      const data = await res.json()
      setHomework(res.ok ? (data.homework ?? []) : [])
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function generateQuestions() {
    if (!form.class_id || !form.subject || !form.title) {
      setGenError("Fill in Class, Subject and Title first.")
      return
    }
    setGenerating(true); setGenError(null)
    try {
      const className = classes.find(c => c.id === form.class_id)?.name || ""
      const res  = await apiFetch("/api/generate-questions", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          class:        className,
          subject:      form.subject,
          chapter:      form.title,
          topic:        form.description || "",
          difficulty,
          marks:        numQuestions * (difficulty === "Hard" ? 5 : difficulty === "Medium" ? 3 : 2),
          questionType: "objective",
          schoolId:     schoolId || "",
          schoolName:   school?.name || "",
        }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error || "Generation failed"); return }
      setQuestions(data.content || "")
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Network error")
    } finally { setGenerating(false) }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const res  = await apiFetch("/api/homework", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ...form, questions: questions.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed"); return }
      setHomework(prev => [data.homework, ...prev])
      setForm({ class_id: "", subject: "", title: "", description: "", due_date: "" })
      setQuestions(""); setGenEnabled(false)
      setShowForm(false)
    } catch { setError("Network error") }
    finally { setSaving(false) }
  }

  async function deleteHW(id: string) {
    if (!confirm("Delete this homework?")) return
    setDeleting(id)
    try {
      await apiFetch(`/api/homework/${id}`, { method: "DELETE" })
      setHomework(prev => prev.filter(h => h.id !== id))
    } finally { setDeleting(null) }
  }

  const grouped = homework.reduce<Record<string, HW[]>>((acc, hw) => {
    const key = hw.classes?.name || "Unknown Class"
    if (!acc[key]) acc[key] = []
    acc[key].push(hw)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 text-white md:p-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Homework</h1>
          <p className="mt-1 text-sm text-slate-400">{homework.length} assignments assigned</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setQuestions(""); setGenEnabled(false) }}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
        >
          {showForm ? "Cancel" : "+ Assign Homework"}
        </button>
      </div>

      {/* ── Form ── */}
      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 space-y-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">New Assignment</p>

          {error && (
            <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm text-red-300">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Class <span className="text-red-400">*</span></label>
              <select value={form.class_id} onChange={e => set("class_id", e.target.value)} required className={inputClass}>
                <option value="">Select class…</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Subject <span className="text-red-400">*</span></label>
              <input type="text" value={form.subject} onChange={e => set("subject", e.target.value)} required placeholder="e.g. Mathematics" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Title / Chapter <span className="text-red-400">*</span></label>
            <input type="text" value={form.title} onChange={e => set("title", e.target.value)} required placeholder="e.g. Chapter 5 — Quadratic Equations" className={inputClass} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Instructions</label>
            <textarea rows={2} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Page numbers, submission instructions…" className={inputClass + " resize-none"} />
          </div>

          <div className="w-48">
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Due Date <span className="text-red-400">*</span></label>
            <input type="date" value={form.due_date} onChange={e => set("due_date", e.target.value)} required className={inputClass} />
          </div>

          {/* ── AI Questions toggle ── */}
          <div className="rounded-2xl border border-purple-400/20 bg-purple-400/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-300">AI Question Generation</p>
                <p className="text-xs text-slate-400 mt-0.5">Generate practice questions and send to parents</p>
              </div>
              <button
                type="button"
                onClick={() => setGenEnabled(v => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${genEnabled ? "bg-purple-500" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${genEnabled ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {genEnabled && (
              <div className="space-y-4 pt-1 border-t border-white/10">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">Difficulty</label>
                    <div className="flex gap-2">
                      {DIFFICULTIES.map(d => (
                        <button key={d} type="button" onClick={() => setDifficulty(d)}
                          className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${difficulty === d ? "bg-purple-500 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-400">No. of Questions</label>
                    <input
                      type="number" min={1} max={20} value={numQuestions}
                      onChange={e => setNumQuestions(Number(e.target.value))}
                      className={inputClass + " text-center"}
                    />
                  </div>
                </div>

                {genError && (
                  <p className="text-xs text-red-400">{genError}</p>
                )}

                <button
                  type="button"
                  onClick={generateQuestions}
                  disabled={generating}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold hover:bg-purple-500 disabled:opacity-60"
                >
                  {generating ? (
                    <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
                  ) : (
                    <>✦ Generate Questions with AI</>
                  )}
                </button>

                {questions && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-emerald-400">Questions generated — edit if needed</p>
                      <button type="button" onClick={() => setQuestions("")} className="text-xs text-slate-500 hover:text-red-400">Clear</button>
                    </div>
                    <textarea
                      rows={10}
                      value={questions}
                      onChange={e => setQuestions(e.target.value)}
                      className={inputClass + " resize-y font-mono text-xs leading-relaxed"}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 px-5 py-2.5 text-sm hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold hover:bg-blue-500 disabled:opacity-60">
              {saving ? "Saving…" : questions ? "Assign + Send to Parents" : "Assign"}
            </button>
          </div>
        </form>
      )}

      {/* ── List ── */}
      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : homework.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0b1220] py-12 text-center text-slate-400">
          <p className="text-lg font-medium">No homework assigned yet</p>
          <p className="mt-1 text-sm">Click &quot;+ Assign Homework&quot; to add the first one</p>
        </div>
      ) : (
        Object.entries(grouped).map(([className, items]) => (
          <div key={className} className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{className}</p>
            {items.map(hw => {
              const badge = dueBadge(hw.due_date)
              const isOpen = expanded === hw.id
              return (
                <div key={hw.id} className="rounded-2xl border border-white/10 bg-[#0b1220] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">{hw.subject}</span>
                        <span className={`rounded-lg border px-2 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                        {hw.questions && (
                          <span className="rounded-lg border border-purple-400/20 bg-purple-400/10 px-2 py-0.5 text-xs font-semibold text-purple-300">✦ AI Questions</span>
                        )}
                      </div>
                      <h3 className="mt-1.5 font-semibold text-white">{hw.title}</h3>
                      {hw.description && <p className="mt-1 text-sm text-slate-400">{hw.description}</p>}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {hw.questions && (
                        <button
                          onClick={() => setExpanded(isOpen ? null : hw.id)}
                          className="rounded-lg border border-purple-400/20 px-3 py-1.5 text-xs text-purple-400 hover:bg-purple-400/10"
                        >
                          {isOpen ? "Hide" : "View Questions"}
                        </button>
                      )}
                      <button
                        onClick={() => deleteHW(hw.id)}
                        disabled={deleting === hw.id}
                        className="rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-400 hover:bg-red-400/10 disabled:opacity-40"
                      >
                        {deleting === hw.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>

                  {isOpen && hw.questions && (
                    <div className="mt-4 rounded-xl border border-purple-400/10 bg-purple-400/5 p-4">
                      <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">{hw.questions}</pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
