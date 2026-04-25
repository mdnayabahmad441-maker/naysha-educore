"use client"

import { useEffect, useMemo, useState } from "react"
import DocumentCanvas from "@/components/documents/DocumentCanvas"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { getSettings, updateSettings } from "@/lib/settings"
import { apiFetch } from "@/lib/api-client"
import {
  DOCUMENT_SETTINGS_KEYS,
  getCertificateBodyText,
  getDefaultDocumentLayout,
  normalizeDocumentLayout,
  type DocumentField,
  type DocumentKind,
  type DocumentLayout
} from "@/lib/document-layouts"
import { useSchool } from "@/context/SchoolContext"

type StudentRecord = {
  id: string
  name: string
  father_name: string | null
  student_code: string | null
  class_id: string | null
  roll_number: number | null
  photo: string | null
  phone: string | null
}

type SchoolClass = {
  id: string
  name: string
}

const documentLabels: Record<DocumentKind, string> = {
  id_card: "ID Card",
  report_card: "Report Card",
  certificate: "Certificate"
}

export default function DocumentStudioPage() {
  const school = useSchool()
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingLayout, setGeneratingLayout] = useState(false)
  const [generatingCertificateText, setGeneratingCertificateText] = useState(false)

  const [activeDocument, setActiveDocument] = useState<DocumentKind>("id_card")
  const [layouts, setLayouts] = useState<Record<DocumentKind, DocumentLayout>>({
    id_card: getDefaultDocumentLayout("id_card"),
    report_card: getDefaultDocumentLayout("report_card"),
    certificate: getDefaultDocumentLayout("certificate")
  })
  const [templateUrls, setTemplateUrls] = useState<Record<DocumentKind, string>>({
    id_card: "",
    report_card: "",
    certificate: ""
  })
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [previewStudentId, setPreviewStudentId] = useState("")
  const [certificateType, setCertificateType] = useState<"bonafide" | "tc">("bonafide")
  const [certificateReason, setCertificateReason] = useState("")
  const [certificateIssueDate, setCertificateIssueDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [aiCertificateDraft, setAiCertificateDraft] = useState<{ title: string; body: string } | null>(null)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      setLoading(true)

      const [
        { data: studentData, error: studentError },
        { data: classData, error: classError },
        idCardTemplate,
        reportCardTemplate,
        certificateTemplate,
        idCardLayout,
        reportCardLayout,
        certificateLayout
      ] = await Promise.all([
        supabase
          .from("students")
          .select("id,name,student_code,class_id,roll_number,photo,parents(father_name,phone)")
          .eq("school_id", schoolId)
          .order("name", { ascending: true }),
        supabase.from("classes").select("id,name").eq("school_id", schoolId).order("name", { ascending: true }),
        getSettings(DOCUMENT_SETTINGS_KEYS.id_card.template),
        getSettings(DOCUMENT_SETTINGS_KEYS.report_card.template),
        getSettings(DOCUMENT_SETTINGS_KEYS.certificate.template),
        getSettings(DOCUMENT_SETTINGS_KEYS.id_card.layout),
        getSettings(DOCUMENT_SETTINGS_KEYS.report_card.layout),
        getSettings(DOCUMENT_SETTINGS_KEYS.certificate.layout)
      ])

      if (studentError) {
        console.error("Document studio student load error:", studentError)
      } else {
        const loadedStudents = ((studentData as any[]) ?? []).map((s: any) => ({
          ...s,
          father_name: s.parents?.[0]?.father_name ?? null,
          phone: s.parents?.[0]?.phone ?? null
        }))
        setStudents(loadedStudents)
        setPreviewStudentId((current) => current || loadedStudents[0]?.id || "")
      }

      if (classError) {
        console.error("Document studio class load error:", classError)
      } else {
        setClasses((classData as SchoolClass[] | null) ?? [])
      }

      setTemplateUrls({
        id_card: typeof idCardTemplate === "string" ? idCardTemplate : "",
        report_card: typeof reportCardTemplate === "string" ? reportCardTemplate : "",
        certificate: typeof certificateTemplate === "string" ? certificateTemplate : ""
      })

      setLayouts({
        id_card: normalizeDocumentLayout("id_card", idCardLayout),
        report_card: normalizeDocumentLayout("report_card", reportCardLayout),
        certificate: normalizeDocumentLayout("certificate", certificateLayout)
      })

      setLoading(false)
    }

    void load()
  }, [schoolId])

  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item.name])), [classes])
  const previewStudent = useMemo(
    () => students.find((student) => student.id === previewStudentId) || students[0] || null,
    [students, previewStudentId]
  )

  const sampleReportRows = useMemo(
    () => [
      { name: "English", total: 100, passing: 33, obtained: 84, status: "PASS" },
      { name: "Mathematics", total: 100, passing: 33, obtained: 78, status: "PASS" },
      { name: "Science", total: 100, passing: 33, obtained: 88, status: "PASS" },
      { name: "Social Science", total: 100, passing: 33, obtained: 74, status: "PASS" },
      { name: "Computer", total: 100, passing: 33, obtained: 91, status: "PASS" }
    ],
    []
  )

  const certificateBody = getCertificateBodyText({
    type: certificateType,
    studentName: previewStudent?.name || "Student Name",
    fatherName: previewStudent?.father_name || "Parent Name",
    className: classMap.get(previewStudent?.class_id || "") || "Class",
    schoolName: school?.name || "School Name",
    issueDate: new Date(certificateIssueDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }),
    reason: certificateReason || undefined
  })

  const previewValues = useMemo(() => {
    const className = classMap.get(previewStudent?.class_id || "") || "Class"
    const issueDateLabel = new Date(certificateIssueDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })

    return {
      id_card: {
        schoolName: school?.name || "School Name",
        schoolLocation: school?.address || school?.subdomain || "School Address",
        studentName: previewStudent?.name || "Student Name",
        fatherName: previewStudent?.father_name || "Father's Name",
        className,
        studentCode: previewStudent?.student_code || "Enrollment No.",
        studentPhone: previewStudent?.phone || "Mobile Number",
        rollBadge: `Roll ${previewStudent?.roll_number ?? "N/A"}`
      },
      report_card: {
        schoolName: school?.name || "School Name",
        reportTitle: "Student Performance Report",
        studentName: `Name: ${previewStudent?.name || "Student Name"}`,
        className: `Class: ${className}`,
        rollNumber: `Roll No: ${previewStudent?.roll_number ?? "-"}`,
        fatherName: `Father Name: ${previewStudent?.father_name || "-"}`,
        examName: "Exam: Final Term",
        grade: "Grade: A",
        percentage: "Percentage: 83.00%",
        result: "PASS",
        totalMarks: "Total Marks: 500",
        obtainedMarks: "Obtained Marks: 415",
        classTeacherSign: "Class Teacher",
        principalSign: "Principal"
      },
      certificate: {
        schoolName: school?.name || "School Name",
        schoolAddress: school?.address || school?.subdomain || "School Address",
        certificateTitle: aiCertificateDraft?.title || (certificateType === "tc" ? "Transfer Certificate" : "Bonafide Certificate"),
        certificateBody: aiCertificateDraft?.body || certificateBody,
        studentName: previewStudent?.name || "Student Name",
        fatherName: `S/O ${previewStudent?.father_name || "Parent Name"}`,
        className: `Class: ${className}`,
        studentCode: `Admission No: ${previewStudent?.student_code || "N/A"}`,
        issueDate: `Date: ${issueDateLabel}`,
        principalSign: "Principal"
      }
    }
  }, [aiCertificateDraft, certificateBody, certificateIssueDate, certificateType, classMap, previewStudent, school])

  const activeLayout = layouts[activeDocument]
  const activeTemplateUrl = templateUrls[activeDocument]
  const activeValues = previewValues[activeDocument]
  const selectedField = activeLayout.fields.find((field) => field.id === selectedFieldId) || activeLayout.fields[0]

  useEffect(() => {
    if (!activeLayout.fields.some((field) => field.id === selectedFieldId)) {
      setSelectedFieldId(activeLayout.fields[0]?.id || null)
    }
  }, [activeLayout, selectedFieldId])

  useEffect(() => {
    setAiCertificateDraft(null)
  }, [certificateType, certificateReason, certificateIssueDate, previewStudentId])

  const updateField = (fieldId: string, patch: Partial<DocumentField>) => {
    setLayouts((current) => ({
      ...current,
      [activeDocument]: {
        ...current[activeDocument],
        fields: current[activeDocument].fields.map((field) =>
          field.id === fieldId ? { ...field, ...patch } : field
        )
      }
    }))
  }

  const saveLayout = async () => {
    setSaving(true)
    try {
      await updateSettings(DOCUMENT_SETTINGS_KEYS[activeDocument].layout, layouts[activeDocument])
      setSaving(false)
      alert(`${documentLabels[activeDocument]} layout saved`)
    } catch (error) {
      console.error(error)
      setSaving(false)
      alert("Failed to save layout")
    }
  }

  const resetLayout = () => {
    setLayouts((current) => ({
      ...current,
      [activeDocument]: getDefaultDocumentLayout(activeDocument)
    }))
  }

  const generateCertificateText = async () => {
    if (!schoolId || activeDocument !== "certificate" || !previewStudent) {
      return
    }

    try {
      setGeneratingCertificateText(true)

      const response = await apiFetch("/api/ai/text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          task: "certificate_text",
          schoolId,
          schoolName: school?.name || "School",
          certificateType,
          studentName: previewStudent.name,
          fatherName: previewStudent.father_name || "Parent",
          className: classMap.get(previewStudent.class_id || "") || "Class",
          studentCode: previewStudent.student_code || "N/A",
          issueDate: certificateIssueDate,
          reason: certificateReason
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.data) {
        throw new Error(result?.error || "Failed to generate certificate text")
      }

      setAiCertificateDraft({
        title: result.data.title,
        body: result.data.body
      })

      alert("AI generated certificate text. It is now shown in the certificate body preview.")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Failed to generate certificate text")
    } finally {
      setGeneratingCertificateText(false)
    }
  }

  const generateAiLayout = async () => {
    const imageUrl = templateUrls[activeDocument]

    if (!imageUrl) {
      alert("Upload a template image first in Settings")
      return
    }

    try {
      setGeneratingLayout(true)

      const response = await apiFetch("/api/ai/document-layout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          kind: activeDocument,
          imageUrl
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.layout) {
        throw new Error(result?.error || "AI layout generation failed")
      }

      setLayouts((current) => ({
        ...current,
        [activeDocument]: normalizeDocumentLayout(activeDocument, result.layout)
      }))

      alert("AI generated a first draft layout. Review it and save when it looks right.")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Failed to generate AI layout")
    } finally {
      setGeneratingLayout(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-white">Loading document studio...</div>
  }

  return (
    <div className="min-h-screen space-y-6 bg-[#0b1220] p-6 text-white">
      <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-6">
        <h1 className="text-3xl font-bold">Document Studio</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-400">
          Design school-specific ID cards, report cards, and certificates with saved field positions. Upload the
          document background from Settings, then adjust each field directly on the preview.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Documents</p>
            {(Object.keys(documentLabels) as DocumentKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setActiveDocument(kind)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  activeDocument === kind
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                    : "border border-white/20 bg-white/[0.07] text-gray-200 hover:bg-white/[0.14]"
                }`}
              >
                {documentLabels[kind]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4">
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Preview student</label>
            <select
              value={previewStudentId}
              onChange={(event) => setPreviewStudentId(event.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm text-white"
            >
              {students.length === 0 ? (
                <option value="">No students found — add students first</option>
              ) : (
                <>
                  {!previewStudentId && <option value="">Select a student</option>}
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </>
              )}
            </select>

            {activeDocument === "certificate" && (
              <div className="mt-4 space-y-3">
                <select
                  value={certificateType}
                  onChange={(event) => setCertificateType(event.target.value as "bonafide" | "tc")}
                  className="w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm text-white"
                >
                  <option value="bonafide">Bonafide Certificate</option>
                  <option value="tc">Transfer Certificate</option>
                </select>
                <input
                  type="date"
                  value={certificateIssueDate}
                  onChange={(event) => setCertificateIssueDate(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm text-white"
                />
                <input
                  value={certificateReason}
                  onChange={(event) => setCertificateReason(event.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm text-white"
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0f172a] p-4 text-sm text-gray-300">
            <p className="font-semibold text-white">Template source</p>
            <p className="mt-2">
              {activeTemplateUrl
                ? "Uploaded school template is active for this document."
                : "No template uploaded yet. The studio will still save field positions for the default layout."}
            </p>
            <a href="/admin/settings" className="mt-3 inline-flex text-sm font-semibold text-cyan-300 hover:text-cyan-200">
              Open Settings to upload templates
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
            <DocumentCanvas
              layout={activeLayout}
              backgroundUrl={activeTemplateUrl || null}
              values={activeValues}
              photoUrl={previewStudent?.photo || null}
              rows={activeDocument === "report_card" ? sampleReportRows : []}
              editable
              selectedFieldId={selectedFieldId}
              onSelectField={setSelectedFieldId}
              onFieldChange={updateField}
              className="mx-auto w-full max-w-[860px]"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={generateAiLayout}
              className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/15"
            >
              {generatingLayout ? "Generating AI Layout..." : "Generate AI Layout"}
            </button>
            <button
              type="button"
              onClick={saveLayout}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {saving ? "Saving..." : `Save ${documentLabels[activeDocument]} Layout`}
            </button>
            <button
              type="button"
              onClick={resetLayout}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Reset to Default
            </button>
            {activeDocument === "certificate" && (
              <button
                type="button"
                onClick={generateCertificateText}
                className="rounded-2xl border border-amber-400/20 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-100 hover:bg-amber-500/15"
              >
                {generatingCertificateText ? "Generating Certificate Text..." : "Generate Certificate Text"}
              </button>
            )}
            {activeDocument === "certificate" && (
              <button
                type="button"
                onClick={() => window.print()}
                className="rounded-2xl border border-emerald-400/20 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/20"
              >
                Print Certificate
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">Field Controls</p>
            <h2 className="mt-2 text-xl font-semibold">{selectedField?.label || "Select a field"}</h2>
            <p className="mt-1 text-sm text-gray-400">
              Drag fields on the preview or fine-tune their position and style here.
            </p>
          </div>

          {selectedField && (
            <div className="space-y-4">
              <RangeControl label="X Position" value={selectedField.x} min={0} max={100 - selectedField.w} onChange={(value) => updateField(selectedField.id, { x: value })} />
              <RangeControl label="Y Position" value={selectedField.y} min={0} max={100 - selectedField.h} onChange={(value) => updateField(selectedField.id, { y: value })} />
              <RangeControl label="Width" value={selectedField.w} min={8} max={100 - selectedField.x} onChange={(value) => updateField(selectedField.id, { w: value })} />
              <RangeControl label="Height" value={selectedField.h} min={3} max={100 - selectedField.y} onChange={(value) => updateField(selectedField.id, { h: value })} />

              {selectedField.type === "text" && (
                <>
                  <RangeControl label="Font Size" value={selectedField.fontSize || 12} min={8} max={36} onChange={(value) => updateField(selectedField.id, { fontSize: value })} />
                  <RangeControl label="Font Weight" value={selectedField.fontWeight || 600} min={400} max={900} step={100} onChange={(value) => updateField(selectedField.id, { fontWeight: value })} />
                  <label className="block text-sm text-gray-300">
                    Text Color
                    <input
                      type="color"
                      value={selectedField.color || "#111827"}
                      onChange={(event) => updateField(selectedField.id, { color: event.target.value })}
                      className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-[#07101d] p-1"
                    />
                  </label>
                  <select
                    value={selectedField.align || "left"}
                    onChange={(event) => updateField(selectedField.id, { align: event.target.value as "left" | "center" | "right" })}
                    className="w-full rounded-xl border border-white/10 bg-[#07101d] px-3 py-3 text-sm text-white"
                  >
                    <option value="left">Align Left</option>
                    <option value="center">Align Center</option>
                    <option value="right">Align Right</option>
                  </select>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 0.5,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block text-sm text-gray-300">
      <div className="mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-gray-400">{value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-400"
      />
    </label>
  )
}
