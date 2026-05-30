"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type Admission = {
  id: string
  admission_number: string
  student_name: string
  date_of_birth: string | null
  gender: string | null
  father_name: string | null
  mother_name: string | null
  phone: string
  email: string | null
  address: string | null
  class_applied: string
  section: string | null
  academic_year: string | null
  previous_school: string | null
  documents: { name: string; url: string; type: string }[] | null
  entrance_test_score: number | null
  merit_rank: number | null
  auto_confirmed: boolean | null
  confirmation_sent_at: string | null
  status: "pending" | "approved" | "enrolled" | "rejected"
  remarks: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-400/15 text-amber-300 border-amber-400/20",
  approved: "bg-blue-400/15 text-blue-300 border-blue-400/20",
  enrolled: "bg-emerald-400/15 text-emerald-300 border-emerald-400/20",
  rejected: "bg-red-400/15 text-red-300 border-red-400/20",
}

function fmt(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })
}

function fmtDob(iso: string | null) {
  if (!iso) return "—"
  // date-only string, parse as local
  const [y, m, d] = iso.split("-")
  return `${d}-${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][parseInt(m)-1]}-${y}`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3">
      <span className="text-sm text-slate-400 shrink-0">{label}</span>
      <span className="text-sm text-right text-white">{value || "—"}</span>
    </div>
  )
}

export default function AdmissionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const school = useSchool()
  const id     = params.id as string

  const [admission, setAdmission] = useState<Admission | null>(null)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await apiFetch(`/api/admissions/${id}`)
      const data = await res.json()
      setAdmission(res.ok ? data.admission : null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { void load() }, [load])

  async function printConfirmation() {
    if (!admission) return

    const { default: jsPDF } = await import("jspdf")
    const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const W    = 210
    const M    = 20   // margin
    let   y    = M

    // ── Header bar ──────────────────────────────────────────────────────────
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, W, 40, "F")

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text(school?.name || "School", W / 2, 18, { align: "center" })

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(180, 200, 220)
    doc.text("ADMISSION CONFIRMATION LETTER", W / 2, 28, { align: "center" })

    y = 52

    // ── Admission number badge ───────────────────────────────────────────────
    doc.setFontSize(9)
    doc.setTextColor(100, 120, 140)
    doc.text("ADMISSION NO.", M, y)
    doc.setFontSize(13)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 40, 60)
    doc.text(admission.admission_number, M, y + 7)

    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100, 120, 140)
    doc.text("DATE OF ADMISSION", W - M, y, { align: "right" })
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 40, 60)
    doc.text(fmt(admission.created_at), W - M, y + 7, { align: "right" })

    y += 20

    // ── Divider ──────────────────────────────────────────────────────────────
    doc.setDrawColor(220, 228, 240)
    doc.setLineWidth(0.4)
    doc.line(M, y, W - M, y)
    y += 8

    // ── Confirmation text ────────────────────────────────────────────────────
    const classLine = `${admission.class_applied}${admission.section ? " – Section " + admission.section : ""}`
    const yearLine  = admission.academic_year ? ` for the academic year ${admission.academic_year}` : ""

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(40, 50, 70)
    const text = `This is to confirm that ${admission.student_name} (S/D/O ${admission.father_name || "—"}) has been granted admission to Class ${classLine}${yearLine} at ${school?.name || "this school"}.`
    const lines = doc.splitTextToSize(text, W - M * 2)
    doc.text(lines, M, y)
    y += lines.length * 6 + 8

    // ── Student details table ────────────────────────────────────────────────
    doc.setFillColor(245, 248, 255)
    doc.setDrawColor(210, 220, 235)
    doc.setLineWidth(0.3)
    doc.roundedRect(M, y, W - M * 2, 8, 2, 2, "FD")
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(80, 100, 130)
    doc.text("STUDENT DETAILS", M + 4, y + 5.5)
    y += 12

    const rows: [string, string][] = [
      ["Full Name",         admission.student_name],
      ["Date of Birth",     fmtDob(admission.date_of_birth)],
      ["Gender",            admission.gender ? admission.gender.charAt(0).toUpperCase() + admission.gender.slice(1) : "—"],
      ["Father's Name",     admission.father_name || "—"],
      ["Mother's Name",     admission.mother_name || "—"],
      ["Phone",             admission.phone],
      ["Email",             admission.email || "—"],
      ["Class Admitted",    classLine],
      ["Academic Year",     admission.academic_year || "—"],
      ["Previous School",   admission.previous_school || "—"],
      ["Address",           admission.address || "—"],
    ]

    const rowH   = 8
    const col1W  = 55
    doc.setFontSize(9)

    rows.forEach(([label, value], i) => {
      const bg = i % 2 === 0 ? [252, 253, 255] : [245, 248, 255]
      doc.setFillColor(bg[0], bg[1], bg[2])
      doc.setDrawColor(220, 228, 240)
      doc.rect(M, y, W - M * 2, rowH, "FD")

      doc.setFont("helvetica", "bold")
      doc.setTextColor(90, 110, 140)
      doc.text(label, M + 3, y + 5.5)

      doc.setFont("helvetica", "normal")
      doc.setTextColor(30, 40, 60)
      const valLines = doc.splitTextToSize(value, W - M * 2 - col1W - 4)
      doc.text(valLines[0], M + col1W, y + 5.5)
      y += rowH
    })

    y += 14

    // ── Signatures ───────────────────────────────────────────────────────────
    doc.setDrawColor(180, 190, 210)
    doc.setLineWidth(0.5)

    // Left: school seal
    doc.line(M, y, M + 50, y)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(120, 130, 150)
    doc.text("School Seal", M + 25, y + 5, { align: "center" })

    // Right: principal signature
    doc.line(W - M - 50, y, W - M, y)
    doc.text("Principal / Authorised Signatory", W - M - 25, y + 5, { align: "center" })

    y += 18

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.setFillColor(240, 245, 255)
    doc.rect(0, 280, W, 17, "F")
    doc.setFontSize(7.5)
    doc.setTextColor(120, 130, 150)
    doc.text(
      `This letter is computer-generated and valid without a physical signature. · ${school?.name || "School"} · Admission No. ${admission.admission_number}`,
      W / 2, 289, { align: "center" }
    )

    doc.autoPrint()
    const blob = doc.output("blob")
    const url  = URL.createObjectURL(blob)
    const win  = window.open(url, "_blank")
    if (win) {
      win.onload = () => setTimeout(() => URL.revokeObjectURL(url), 10000)
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-slate-400">Loading…</div>
  }

  if (!admission) {
    return <div className="p-10 text-center text-slate-400">Admission not found.</div>
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 text-white md:p-10">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/admissions")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            ← Back
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold">{admission.student_name}</h1>
              <span className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[admission.status]}`}>
                {admission.status}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-slate-500">ADM {admission.admission_number}</p>
          </div>
        </div>

        <button
          onClick={printConfirmation}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 16v-8M9 13l3 3 3-3M5 20h14a2 2 0 002-2V9l-5-5H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          Print Confirmation Letter
        </button>
      </div>

      {/* Details */}
      <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-6 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Student Details</p>
        <Row label="Admission No."    value={admission.admission_number} />
        <Row label="Student Name"     value={admission.student_name} />
        <Row label="Date of Birth"    value={fmtDob(admission.date_of_birth)} />
        <Row label="Gender"           value={admission.gender ? admission.gender.charAt(0).toUpperCase() + admission.gender.slice(1) : "—"} />
        <Row label="Father's Name"    value={admission.father_name || "—"} />
        <Row label="Mother's Name"    value={admission.mother_name || "—"} />
        <Row label="Phone"            value={admission.phone} />
        <Row label="Email"            value={admission.email || "—"} />
        <Row label="Class Applied"    value={`${admission.class_applied}${admission.section ? " – " + admission.section : ""}`} />
        <Row label="Academic Year"    value={admission.academic_year || "—"} />
        <Row label="Previous School"  value={admission.previous_school || "—"} />
        <Row label="Entrance Score"   value={admission.entrance_test_score != null ? String(admission.entrance_test_score) : "—"} />
        <Row label="Merit Rank"       value={admission.merit_rank != null ? String(admission.merit_rank) : "—"} />
        <Row label="Auto Confirmed"   value={admission.auto_confirmed ? "Yes" : "No"} />
        <Row label="Confirmation Sent" value={admission.confirmation_sent_at ? fmt(admission.confirmation_sent_at) : "—"} />
        <Row label="Address"          value={admission.address || "—"} />
        <Row label="Date of Enquiry"  value={fmt(admission.created_at)} />
        {admission.documents && admission.documents.length > 0 && (
          <div className="rounded-xl border border-white/6 bg-white/3 p-4">
            <p className="mb-3 text-sm text-slate-400">Uploaded Documents</p>
            <div className="space-y-2">
              {admission.documents.map((doc, index) => (
                <a
                  key={index}
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm text-blue-200 hover:bg-slate-900"
                >
                  {doc.name || `Document ${index + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
        {admission.remarks && <Row label="Remarks" value={admission.remarks} />}
      </div>

    </div>
  )
}
