"use client"

import { useEffect, useRef, useState } from "react"
import { apiFetch } from "@/lib/api-client"
import { getSchoolId } from "@/lib/school"
import { useSchool } from "@/context/SchoolContext"

// ─── Constants ────────────────────────────────────────────────────────────────

const CLASSES = ["1","2","3","4","5","6","7","8","9","10","11","12"]

const SUBJECTS_BY_CLASS: Record<string, string[]> = {
  "1":  ["English","Hindi","Mathematics","EVS"],
  "2":  ["English","Hindi","Mathematics","EVS"],
  "3":  ["English","Hindi","Mathematics","EVS"],
  "4":  ["English","Hindi","Mathematics","EVS"],
  "5":  ["English","Hindi","Mathematics","EVS"],
  "6":  ["English","Hindi","Mathematics","Science","Social Science","Sanskrit"],
  "7":  ["English","Hindi","Mathematics","Science","Social Science","Sanskrit"],
  "8":  ["English","Hindi","Mathematics","Science","Social Science","Sanskrit"],
  "9":  ["English","Hindi","Mathematics","Science","Social Science","Sanskrit","Computer Science"],
  "10": ["English","Hindi","Mathematics","Science","Social Science","Sanskrit","Computer Science"],
  "11": ["English","Physics","Chemistry","Mathematics","Biology","Accountancy","Business Studies","Economics","History","Political Science","Computer Science"],
  "12": ["English","Physics","Chemistry","Mathematics","Biology","Accountancy","Business Studies","Economics","History","Political Science","Computer Science"],
}

type SavedPaper = {
  id: string
  class: string
  subject: string
  chapter: string
  difficulty: string
  total_marks: number
  created_at: string
}

// ─── PDF Export ───────────────────────────────────────────────────────────────

async function downloadPdf(
  content: string,
  meta: { cls: string; subject: string; chapter: string; marks: number; schoolName: string; isAnswerKey?: boolean }
) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const pageW = doc.internal.pageSize.getWidth()
  const margin = 15
  const maxW = pageW - margin * 2
  let y = margin

  const addLine = (text: string, size = 11, style: "normal" | "bold" = "normal", color = "#111827") => {
    doc.setFontSize(size)
    doc.setFont("helvetica", style)
    doc.setTextColor(color)
    const lines = doc.splitTextToSize(text, maxW)
    lines.forEach((line: string) => {
      if (y > 275) { doc.addPage(); y = margin }
      doc.text(line, margin, y)
      y += size * 0.45
    })
    y += 1
  }

  const addSectionHeader = (text: string) => {
    y += 3
    if (y > 270) { doc.addPage(); y = margin }
    const [r, g, b] = meta.isAnswerKey ? [5, 101, 77] : [37, 99, 235]
    doc.setFillColor(r, g, b)
    doc.roundedRect(margin, y - 5, maxW, 9, 2, 2, "F")
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor("#ffffff")
    doc.text(text, margin + 3, y + 1)
    y += 9
    doc.setTextColor("#111827")
  }

  // Header box
  const [hr, hg, hb] = meta.isAnswerKey ? [5, 78, 60] : [15, 23, 42]
  doc.setFillColor(hr, hg, hb)
  doc.rect(0, 0, pageW, 36, "F")
  doc.setFontSize(16)
  doc.setFont("helvetica", "bold")
  doc.setTextColor("#ffffff")
  doc.text(meta.schoolName, pageW / 2, 12, { align: "center" })
  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.text(`Class ${meta.cls}  |  ${meta.subject}  |  ${meta.chapter}  |  Max Marks: ${meta.marks}`, pageW / 2, 22, { align: "center" })
  if (meta.isAnswerKey) {
    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("ANSWER KEY / MARKING SCHEME — FOR TEACHER USE ONLY", pageW / 2, 31, { align: "center" })
  }
  y = 44

  const lines = content.split("\n")
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { y += 3; continue }

    if (/^SECTION\s+[ABC]/i.test(line) || /^---/.test(line) || /^ANSWER KEY/i.test(line)) {
      addSectionHeader(line.replace(/^-+/, "").trim() || line)
    } else if (/^(Q\d+|[0-9]+\.)/.test(line)) {
      addLine(line, 11, "normal")
    } else if (/^\(Answer any/i.test(line) || /^General Instructions/i.test(line) || /^Note:/i.test(line) || /^Examiner/i.test(line)) {
      addLine(line, 10, "bold")
    } else if (/^OR$/i.test(line)) {
      y += 2
      addLine("                 ─── OR ───", 10, "bold", "#6b7280")
      y += 2
    } else if (/^[•\-]\s/.test(line)) {
      addLine("  • " + line.slice(2), 10)
    } else {
      addLine(line, 10)
    }
  }

  const filename = meta.isAnswerKey
    ? `AnswerKey_Class${meta.cls}_${meta.subject}.pdf`
    : `QuestionPaper_Class${meta.cls}_${meta.subject}.pdf`
  doc.save(filename)
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionPaperPage() {
  const school = useSchool()
  const [schoolId, setSchoolId] = useState<string | null>(null)

  // Form
  const [cls, setCls] = useState("10")
  const [subject, setSubject] = useState("")
  const [chapter, setChapter] = useState("")
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [marks, setMarks] = useState("40")

  // Paper state
  const [content, setContent] = useState("")
  const [editContent, setEditContent] = useState("")
  const [editMode, setEditMode] = useState(false)
  const [answerKey, setAnswerKey] = useState("")
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([])
  const [tab, setTab] = useState<"generate" | "history">("generate")
  const [pdfLoading, setPdfLoading] = useState(false)
  const [akPdfLoading, setAkPdfLoading] = useState(false)

  const paperRef = useRef<HTMLDivElement>(null)

  const subjects = SUBJECTS_BY_CLASS[cls] ?? []

  useEffect(() => { getSchoolId().then(setSchoolId) }, [])
  useEffect(() => { if (tab === "history" && schoolId) loadHistory() }, [tab, schoolId])

  // Reset subject when class changes
  useEffect(() => {
    setSubject(SUBJECTS_BY_CLASS[cls]?.[0] ?? "")
  }, [cls])

  async function loadHistory() {
    if (!schoolId) return
    const res = await apiFetch(`/api/generate-questions?schoolId=${schoolId}`)
    const data = await res.json()
    if (data.success) setSavedPapers(data.papers)
  }

  async function generate(save = false) {
    if (!subject || !chapter.trim()) { alert("Fill in subject and chapter"); return }
    if (!schoolId) { alert("School not loaded"); return }

    setGenerating(true)
    setContent("")
    setAnswerKey("")
    setEditMode(false)
    setSavedId(null)

    try {
      const res = await apiFetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: cls, subject, chapter: chapter.trim(), topic: topic.trim(), difficulty, marks: Number(marks), schoolId, save }),
      })
      const data = await res.json()

      if (!res.ok) { alert(data.error || "Generation failed"); return }

      setContent(data.content)
      setEditContent(data.content)
      setAnswerKey(data.answerKey || "")
      if (save) setSavedId("saved")
    } catch (err: any) {
      alert(err.message || "Failed to generate")
    } finally {
      setGenerating(false)
    }
  }

  async function saveEdits() {
    if (!schoolId || !editContent.trim()) return
    setSaving(true)
    try {
      const res = await apiFetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: cls, subject, chapter, topic, difficulty, marks: Number(marks), schoolId, save: true }),
      })
      const data = await res.json()
      if (res.ok) {
        setContent(editContent)
        setEditMode(false)
        setSavedId("saved")
        await loadHistory()
      } else {
        alert(data.error)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadPdf() {
    const src = editMode ? editContent : content
    if (!src) return
    setPdfLoading(true)
    try {
      await downloadPdf(src, {
        cls, subject, chapter, marks: Number(marks), schoolName: school?.name || "School",
      })
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleDownloadAnswerKeyPdf() {
    if (!answerKey) return
    setAkPdfLoading(true)
    try {
      await downloadPdf(answerKey, {
        cls, subject, chapter, marks: Number(marks),
        schoolName: school?.name || "School",
        isAnswerKey: true,
      })
    } finally {
      setAkPdfLoading(false)
    }
  }

  function printSection(mode: "paper" | "answerkey") {
    document.documentElement.classList.add(`print-${mode}-mode`)
    const cleanup = () => {
      document.documentElement.classList.remove(`print-${mode}-mode`)
      window.removeEventListener("afterprint", cleanup)
    }
    window.addEventListener("afterprint", cleanup)
    window.print()
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">AI Question Paper Generator</h1>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          CBSE Pattern
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-1">
        {(["generate", "history"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition rounded-t-xl ${
              tab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {t === "history" ? "Saved Papers" : "Generate"}
          </button>
        ))}
      </div>

      {/* ── TAB: Generate ── */}
      {tab === "generate" && (
        <>
          {/* Form */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Class */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Class</label>
                <select value={cls} onChange={e => setCls(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white">
                  {CLASSES.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white">
                  {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white">
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Chapter */}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Chapter *</label>
                <input value={chapter} onChange={e => setChapter(e.target.value)}
                  placeholder="e.g. Chemical Reactions and Equations"
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white placeholder:text-slate-500" />
              </div>

              {/* Marks */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">Total Marks</label>
                <input type="number" min={10} max={100} value={marks} onChange={e => setMarks(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white" />
              </div>

              {/* Topic */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-slate-400">
                  Specific Topic <span className="normal-case text-slate-500">(optional)</span>
                </label>
                <input value={topic} onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Balancing chemical equations, Types of reactions"
                  className="w-full rounded-xl border border-white/10 bg-[#08111f] px-4 py-2.5 text-sm text-white placeholder:text-slate-500" />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => generate(false)}
                disabled={generating || !chapter.trim()}
                className="flex-1 rounded-xl bg-[linear-gradient(135deg,#2563eb,#0ea5e9)] py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:px-8"
              >
                {generating ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Generating...
                  </span>
                ) : "Generate Question Paper"}
              </button>
              {content && (
                <button
                  onClick={() => generate(true)}
                  disabled={generating}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/20 disabled:opacity-50"
                >
                  Regenerate &amp; Save
                </button>
              )}
            </div>
          </div>

          {/* Output */}
          {content && (
            <>
              <style>{`
                @media print {
                  html, body { background: white !important; height: auto !important; overflow: visible !important; }
                  body * { visibility: hidden; }

                  /* Paper-only print */
                  html.print-paper-mode #qp-print-area,
                  html.print-paper-mode #qp-print-area * { visibility: visible; }
                  html.print-paper-mode #qp-print-area {
                    position: absolute; top: 0; left: 0; right: 0;
                    background: white; padding: 12mm 18mm; box-shadow: none; border: none;
                  }

                  /* Answer-key-only print */
                  html.print-answerkey-mode #qk-print-area,
                  html.print-answerkey-mode #qk-print-area * { visibility: visible; }
                  html.print-answerkey-mode #qk-print-area {
                    position: absolute; top: 0; left: 0; right: 0;
                    background: white; padding: 12mm 18mm; box-shadow: none; border: none;
                  }

                  /* Shared color overrides */
                  #qp-print-area *, #qk-print-area * {
                    color: #111 !important;
                    background-color: transparent !important;
                    border-color: #d1d5db !important;
                  }
                  #qp-print-area .qp-sec-hdr {
                    background-color: #1e40af !important;
                    color: #fff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    border-radius: 6px;
                  }
                  #qk-print-area .qp-sec-hdr {
                    background-color: #065f46 !important;
                    color: #fff !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    border-radius: 6px;
                  }
                  #qp-print-area .qp-mark-badge,
                  #qk-print-area .qp-mark-badge {
                    border: 1px solid #b45309 !important;
                    color: #b45309 !important;
                    background: transparent !important;
                    border-radius: 4px;
                    padding: 0 4px;
                    font-size: 10px;
                    font-weight: 600;
                  }
                  #qp-print-area .qp-toolbar,
                  #qk-print-area .qp-toolbar { display: none !important; visibility: hidden !important; }
                  #qp-print-area .qp-print-header,
                  #qk-print-area .qp-print-header { display: block !important; visibility: visible !important; }
                  @page { margin: 10mm; }
                }
              `}</style>

              <div id="qp-print-area" className="rounded-2xl border border-white/10 bg-white/5">
                {/* Print-only header */}
                <div className="qp-print-header hidden border-b-2 border-gray-800 pb-3 mb-4 text-center">
                  <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111" }}>{school?.name || "School"}</h2>
                  <p style={{ fontSize: "12px", color: "#111", marginTop: "4px" }}>
                    Class {cls}&nbsp;&nbsp;|&nbsp;&nbsp;{subject}&nbsp;&nbsp;|&nbsp;&nbsp;{chapter}{topic ? ` — ${topic}` : ""}&nbsp;&nbsp;|&nbsp;&nbsp;Max Marks: {marks}
                  </p>
                </div>

                {/* Toolbar */}
                <div className="qp-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Generated Paper</span>
                    {savedId && (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                        Saved
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {editMode ? (
                      <>
                        <button
                          onClick={() => { setEditContent(content); setEditMode(false) }}
                          className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdits}
                          disabled={saving}
                          className="rounded-xl bg-[linear-gradient(135deg,#10b981,#0f766e)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setEditMode(true)}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => printSection("paper")}
                      className="rounded-xl bg-[linear-gradient(135deg,#0f766e,#0d9488)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                    >
                      Print
                    </button>
                    <button
                      onClick={handleDownloadPdf}
                      disabled={pdfLoading}
                      className="rounded-xl bg-[linear-gradient(135deg,#7c3aed,#4f46e5)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                    >
                      {pdfLoading ? "Exporting..." : "Download PDF"}
                    </button>
                  </div>
                </div>

                {/* Content */}
                {editMode ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full bg-transparent px-6 py-5 font-mono text-sm text-slate-200 focus:outline-none"
                    style={{ minHeight: "600px", resize: "vertical" }}
                  />
                ) : (
                  <div ref={paperRef} className="px-6 py-6">
                    <PaperRenderer content={content} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Answer Key Section ── */}
          {answerKey && (
            <div id="qk-print-area" className="rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
              {/* Print-only header */}
              <div className="qp-print-header hidden border-b-2 border-gray-800 pb-3 mb-4 text-center">
                <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "#111" }}>{school?.name || "School"}</h2>
                <p style={{ fontSize: "12px", color: "#111", marginTop: "4px" }}>
                  Class {cls}&nbsp;&nbsp;|&nbsp;&nbsp;{subject}&nbsp;&nbsp;|&nbsp;&nbsp;{chapter}{topic ? ` — ${topic}` : ""}&nbsp;&nbsp;|&nbsp;&nbsp;Max Marks: {marks}
                </p>
                <p style={{ fontSize: "11px", fontWeight: "bold", color: "#065f46", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Answer Key / Marking Scheme — For Teacher Use Only
                </p>
              </div>

              {/* Toolbar */}
              <div className="qp-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-emerald-400/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-emerald-200">Answer Key / Marking Scheme</span>
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-xs text-emerald-300">
                    Teacher Only
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => printSection("answerkey")}
                    className="rounded-xl bg-[linear-gradient(135deg,#065f46,#059669)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                  >
                    Print Answer Key
                  </button>
                  <button
                    onClick={handleDownloadAnswerKeyPdf}
                    disabled={akPdfLoading}
                    className="rounded-xl bg-[linear-gradient(135deg,#047857,#0f766e)] px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-60"
                  >
                    {akPdfLoading ? "Exporting..." : "Download Answer Key PDF"}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <PaperRenderer content={answerKey} />
              </div>
            </div>
          )}
        </>
      )}

      {/* ── TAB: History ── */}
      {tab === "history" && (
        <div className="rounded-2xl border border-white/10 bg-white/5">
          {savedPapers.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No saved question papers yet. Generate and save one first.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {savedPapers.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-semibold text-white">
                      Class {p.class} — {p.subject}
                    </p>
                    <p className="text-xs text-slate-400">
                      {p.chapter} · {p.difficulty} · {p.total_marks} marks
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("en-IN", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Paper Renderer ───────────────────────────────────────────────────────────

function PaperRenderer({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <div className="space-y-1 font-sans text-sm leading-relaxed text-slate-200">
      {lines.map((raw, i) => {
        const line = raw.trim()
        if (!line) return <div key={i} className="h-3" />

        if (/^SECTION\s+[ABC]/i.test(line)) {
          return (
            <div key={i} className="qp-sec-hdr my-4 rounded-lg bg-blue-600/20 px-4 py-2 text-base font-bold text-blue-200 tracking-wide">
              {line}
            </div>
          )
        }

        if (/^---+/.test(line)) return <hr key={i} className="border-white/10 my-3" />

        if (/^OR$/i.test(line)) {
          return (
            <p key={i} className="my-2 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
              ─── OR ───
            </p>
          )
        }

        if (/^\*\*(.+)\*\*$/.test(line)) {
          return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, "")}</p>
        }

        if (/^(General Instructions|Note:|Time:|Max Marks:)/i.test(line)) {
          return <p key={i} className="font-semibold text-slate-100">{line}</p>
        }

        if (/^[•\-]\s/.test(line)) {
          return <p key={i} className="pl-4 text-slate-300">• {line.slice(2)}</p>
        }

        if (/^\(a\)|\(b\)|\(c\)|\(d\)/i.test(line)) {
          return <p key={i} className="pl-8 text-slate-300">{line}</p>
        }

        if (/^Q?\d+[\.\)]\s/.test(line) || /^\d+\.\s/.test(line)) {
          return <p key={i} className="mt-3 font-medium text-white">{line}</p>
        }

        // Marks indicators
        const marksMatch = line.match(/\[(\d+)\s*[Mm]arks?\]/)
        if (marksMatch) {
          const [full] = marksMatch
          const parts = line.split(full)
          return (
            <p key={i} className="flex gap-2">
              <span>{parts[0]}</span>
              <span className="qp-mark-badge rounded border border-amber-400/30 bg-amber-400/10 px-2 text-xs font-semibold text-amber-300">{full}</span>
              <span>{parts[1]}</span>
            </p>
          )
        }

        return <p key={i} className="text-slate-300">{line}</p>
      })}
    </div>
  )
}
