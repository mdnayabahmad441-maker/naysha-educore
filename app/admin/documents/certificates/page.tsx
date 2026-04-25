"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useSchool } from "@/context/SchoolContext"
import { getSettings } from "@/lib/settings"
import { apiFetch } from "@/lib/api-client"
import DocumentCanvas from "@/components/documents/DocumentCanvas"
import {
  getCertificateBodyText,
  normalizeDocumentLayout,
  type DocumentLayout
} from "@/lib/document-layouts"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

type Student = {
  id: string
  name: string
  father_name: string | null
  student_code: string | null
  class_id: string | null
  roll_number: number | null
}

type SchoolClass = {
  id: string
  name: string
}

type CertType = "bonafide" | "tc"

const certLabels: Record<CertType, string> = {
  bonafide: "Bonafide Certificate",
  tc: "Transfer Certificate"
}

export default function CertificatesPage() {
  const school = useSchool()
  const previewRef = useRef<HTMLDivElement | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [templateUrl, setTemplateUrl] = useState("")
  const [layout, setLayout] = useState<DocumentLayout>(() => normalizeDocumentLayout("certificate", null))
  const [loading, setLoading] = useState(true)

  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [certType, setCertType] = useState<CertType>("bonafide")
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [reason, setReason] = useState("")
  const [search, setSearch] = useState("")

  const [aiDraft, setAiDraft] = useState<{ title: string; body: string } | null>(null)
  const [generating, setGenerating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const load = async () => {
      const schoolId = await getSchoolId()
      if (!schoolId) return

      const [
        { data: classData },
        { data: studentData },
        templateSetting,
        layoutSetting
      ] = await Promise.all([
        supabase.from("classes").select("id,name").eq("school_id", schoolId).order("name"),
        supabase
          .from("students")
          .select("id,name,student_code,class_id,roll_number")
          .eq("school_id", schoolId)
          .order("name"),
        getSettings("certificate_template"),
        getSettings("certificate_layout")
      ])

      const studentRows = ((studentData as Student[]) ?? [])
      const studentIds = studentRows.map((student) => student.id)

      let parentMap = new Map<string, { father_name: string | null }>()

      if (studentIds.length > 0) {
        const { data: parentData, error: parentError } = await supabase
          .from("parents")
          .select("student_id,father_name")
          .in("student_id", studentIds)

        if (parentError) {
          console.error("Certificate parent load error:", parentError)
        } else {
          parentMap = new Map(
            ((parentData as Array<{ student_id: string; father_name: string | null }>) ?? []).map((parent) => [
              parent.student_id,
              { father_name: parent.father_name }
            ])
          )
        }
      }

      const studentList = studentRows.map((student) => ({
        ...student,
        father_name: parentMap.get(student.id)?.father_name ?? null
      }))

      setClasses((classData as SchoolClass[] | null) ?? [])
      setStudents(studentList)
      setTemplateUrl(typeof templateSetting === "string" ? templateSetting : "")
      setLayout(normalizeDocumentLayout("certificate", layoutSetting))

      const firstStudent = studentList[0]
      if (firstStudent) setSelectedStudentId(firstStudent.id)

      setLoading(false)
    }

    void load()
  }, [])

  // Reset AI draft when inputs change
  useEffect(() => {
    setAiDraft(null)
  }, [selectedStudentId, certType, issueDate, reason])

  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes])

  const filteredStudents = useMemo(() => {
    const term = search.toLowerCase()
    if (!term) return students
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        (s.student_code || "").toLowerCase().includes(term)
    )
  }, [students, search])

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  )

  const issueDateLabel = useMemo(
    () =>
      new Date(issueDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }),
    [issueDate]
  )

  const defaultBody = useMemo(() => {
    if (!selectedStudent) return ""
    return getCertificateBodyText({
      type: certType,
      studentName: selectedStudent.name,
      fatherName: selectedStudent.father_name || "Parent",
      className: classMap.get(selectedStudent.class_id || "") || "Class",
      schoolName: school?.name || "School",
      issueDate: issueDateLabel,
      reason: reason || undefined
    })
  }, [selectedStudent, certType, classMap, school, issueDateLabel, reason])

  const canvasValues = useMemo(() => {
    if (!selectedStudent)
      return {
        schoolName: school?.name || "School Name",
        schoolAddress: school?.address || "",
        certificateTitle: certLabels[certType],
        certificateBody: "",
        studentName: "Student Name",
        fatherName: "S/O Parent Name",
        className: "Class",
        studentCode: "Admission No: —",
        issueDate: `Date: ${issueDateLabel}`,
        principalSign: "Principal"
      }

    const className = classMap.get(selectedStudent.class_id || "") || "Class"

    return {
      schoolName: school?.name || "School Name",
      schoolAddress: school?.address || school?.subdomain || "",
      certificateTitle: aiDraft?.title ?? certLabels[certType],
      certificateBody: aiDraft?.body ?? defaultBody,
      studentName: selectedStudent.name,
      fatherName: `S/O ${selectedStudent.father_name || "Parent Name"}`,
      className: `Class: ${className}`,
      studentCode: `Admission No: ${selectedStudent.student_code || "N/A"}`,
      issueDate: `Date: ${issueDateLabel}`,
      principalSign: "Principal"
    }
  }, [selectedStudent, certType, classMap, school, issueDateLabel, aiDraft, defaultBody])

  const generateAiText = async () => {
    if (!selectedStudent) return

    const schoolId = await getSchoolId()
    if (!schoolId) return

    try {
      setGenerating(true)

      const response = await apiFetch("/api/ai/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "certificate_text",
          schoolId,
          schoolName: school?.name || "School",
          certificateType: certType,
          studentName: selectedStudent.name,
          fatherName: selectedStudent.father_name || "Parent",
          className: classMap.get(selectedStudent.class_id || "") || "Class",
          studentCode: selectedStudent.student_code || "N/A",
          issueDate,
          reason
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.data) {
        throw new Error(result?.error || "Failed to generate certificate text")
      }

      setAiDraft({ title: result.data.title, body: result.data.body })
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to generate certificate text")
    } finally {
      setGenerating(false)
    }
  }

  const downloadPdf = async () => {
    if (!previewRef.current) return

    try {
      setDownloading(true)

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true
      })

      const img = canvas.toDataURL("image/png")
      const pdf = new jsPDF({
        orientation: layout.width > layout.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4"
      })

      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = (canvas.height * pageW) / canvas.width

      pdf.addImage(img, "PNG", 0, 0, pageW, pageH)

      const studentName = selectedStudent?.name?.replace(/\s+/g, "_") || "certificate"
      pdf.save(`${certType}_${studentName}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Failed to download PDF")
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return <div className="p-10 text-white">Loading certificate generator...</div>
  }

  return (
    <div className="min-h-screen space-y-6 p-6 text-white md:p-10">
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; color-adjust: exact; }
          body * { visibility: hidden !important; }
          .cert-print-area, .cert-print-area * { visibility: visible !important; }
          .cert-print-area { position: fixed; inset: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* HEADER */}
      <div className="no-print rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-3xl font-bold">Certificate Generator</h1>
        <p className="mt-2 text-sm text-gray-400">
          Generate bonafide and transfer certificates using your school template. Upload the template from{" "}
          <a href="/admin/settings" className="text-cyan-400 underline">
            Settings
          </a>.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* LEFT PANEL */}
        <div className="no-print space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          {/* Certificate Type */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Certificate Type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["bonafide", "tc"] as CertType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCertType(type)}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    certType === type
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                      : "border border-white/10 bg-[#0f172a] text-gray-300 hover:bg-white/10"
                  }`}
                >
                  {certLabels[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Student Select */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Student</p>
            <input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white"
            />
            <div className="max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1220]">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left text-sm transition hover:bg-white/5 ${
                    selectedStudentId === s.id ? "bg-blue-600/20 text-blue-200" : "text-gray-200"
                  }`}
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="text-xs text-gray-400">
                    {classMap.get(s.class_id || "") || "No class"} •{" "}
                    {s.student_code || "No ID"}
                  </span>
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <p className="p-4 text-sm text-gray-500">No students found</p>
              )}
            </div>
          </div>

          {/* Date & Reason */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">Issue Date</p>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200/70">
              Reason <span className="normal-case text-gray-500">(optional)</span>
            </p>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={certType === "tc" ? "e.g. admission in another school" : "e.g. bank account opening"}
              className="w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Template status */}
          <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-3 text-xs text-gray-400">
            {templateUrl
              ? "Your uploaded certificate template is active."
              : "No certificate template uploaded yet — upload one in Settings."}
          </div>

          {/* Actions */}
          <button
            type="button"
            onClick={generateAiText}
            disabled={generating || !selectedStudent}
            className="w-full rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {generating ? "Generating AI Text..." : "Generate Certificate Text with AI"}
          </button>

          {aiDraft && (
            <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-3 text-xs text-cyan-100">
              <p className="font-semibold">{aiDraft.title}</p>
              <p className="mt-1 line-clamp-3 text-gray-300">{aiDraft.body}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!selectedStudent}
              className="flex-1 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
            >
              Print
            </button>
            <button
              type="button"
              onClick={downloadPdf}
              disabled={downloading || !selectedStudent}
              className="flex-1 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {downloading ? "Saving..." : "Download PDF"}
            </button>
          </div>
        </div>

        {/* RIGHT — CERTIFICATE PREVIEW */}
        <div className="cert-print-area">
          {!selectedStudent ? (
            <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.04] text-gray-400">
              Select a student to preview the certificate
            </div>
          ) : (
            <div ref={previewRef}>
              <DocumentCanvas
                layout={layout}
                backgroundUrl={templateUrl || null}
                values={canvasValues}
                className="mx-auto w-full max-w-5xl"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
