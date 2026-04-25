export type DocumentKind = "id_card" | "report_card" | "certificate"

export type DocumentFieldType = "text" | "photo" | "table"

export type DocumentField = {
  id: string
  label: string
  type: DocumentFieldType
  x: number
  y: number
  w: number
  h: number
  fontSize?: number
  fontWeight?: number
  color?: string
  align?: "left" | "center" | "right"
  uppercase?: boolean
  bgColor?: string
  bgOpacity?: number
  borderRadius?: number
  borderColor?: string
  letterSpacing?: number
}

export type DocumentLayout = {
  width: number
  height: number
  fields: DocumentField[]
}

export const DOCUMENT_SETTINGS_KEYS: Record<DocumentKind, { template: string; layout: string }> = {
  id_card: {
    template: "id_card_template",
    layout: "id_card_layout"
  },
  report_card: {
    template: "report_card_template",
    layout: "report_card_layout"
  },
  certificate: {
    template: "certificate_template",
    layout: "certificate_layout"
  }
}

const defaultLayouts: Record<DocumentKind, DocumentLayout> = {
  id_card: {
    width: 1054,
    height: 1536,
    fields: [
      { id: "schoolName", label: "School Name", type: "text", x: 18, y: 4.5, w: 72, h: 6, fontSize: 22, fontWeight: 800, color: "#241b73", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 12, y: 31.5, w: 76, h: 4.2, fontSize: 11, fontWeight: 700, color: "#2d287e", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 31.6, y: 34.3, w: 36.8, h: 33.8, borderRadius: 20, borderColor: "#261f78" },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 66, y: 69.2, w: 24, h: 4.5, fontSize: 10, fontWeight: 700, color: "#ffffff", align: "center", uppercase: true, bgColor: "#241b73", bgOpacity: 0.88, borderRadius: 999 },
      { id: "studentName", label: "Student Name", type: "text", x: 44, y: 74.4, w: 47, h: 5, fontSize: 12, fontWeight: 800, color: "#241b73", uppercase: true },
      { id: "fatherName", label: "Father Name", type: "text", x: 44, y: 80.1, w: 47, h: 4.4, fontSize: 11, fontWeight: 700, color: "#241b73" },
      { id: "className", label: "Course / Class", type: "text", x: 44, y: 85.6, w: 47, h: 4.2, fontSize: 11, fontWeight: 700, color: "#241b73" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 44, y: 90.9, w: 47, h: 4.2, fontSize: 11, fontWeight: 700, color: "#241b73" },
      { id: "studentPhone", label: "Phone", type: "text", x: 44, y: 95.7, w: 47, h: 3.8, fontSize: 10, fontWeight: 700, color: "#241b73" }
    ]
  },
  report_card: {
    width: 1240,
    height: 1754,
    fields: [
      { id: "schoolName", label: "School Name", type: "text", x: 18, y: 4, w: 64, h: 4.8, fontSize: 24, fontWeight: 800, color: "#0f172a", align: "center", uppercase: true },
      { id: "reportTitle", label: "Report Title", type: "text", x: 22, y: 9.6, w: 56, h: 3.8, fontSize: 15, fontWeight: 700, color: "#334155", align: "center" },
      { id: "studentName", label: "Student Name", type: "text", x: 8, y: 18, w: 34, h: 3.6, fontSize: 13, fontWeight: 700, color: "#111827" },
      { id: "className", label: "Class", type: "text", x: 8, y: 22.5, w: 22, h: 3.2, fontSize: 12, fontWeight: 600, color: "#111827" },
      { id: "rollNumber", label: "Roll No", type: "text", x: 8, y: 27, w: 22, h: 3.2, fontSize: 12, fontWeight: 600, color: "#111827" },
      { id: "fatherName", label: "Father Name", type: "text", x: 8, y: 31.5, w: 34, h: 3.2, fontSize: 12, fontWeight: 600, color: "#111827" },
      { id: "examName", label: "Exam", type: "text", x: 62, y: 18, w: 28, h: 3.2, fontSize: 12, fontWeight: 600, color: "#111827", align: "right" },
      { id: "grade", label: "Grade", type: "text", x: 62, y: 22.5, w: 28, h: 3.2, fontSize: 12, fontWeight: 700, color: "#111827", align: "right" },
      { id: "percentage", label: "Percentage", type: "text", x: 62, y: 27, w: 28, h: 3.2, fontSize: 12, fontWeight: 700, color: "#111827", align: "right" },
      { id: "result", label: "Result", type: "text", x: 62, y: 31.5, w: 28, h: 3.8, fontSize: 16, fontWeight: 800, color: "#166534", align: "right", uppercase: true },
      { id: "marksTable", label: "Marks Table", type: "table", x: 8, y: 39, w: 84, h: 35, borderRadius: 14, borderColor: "#cbd5e1" },
      { id: "obtainedMarks", label: "Obtained Marks", type: "text", x: 8, y: 78, w: 22, h: 3.2, fontSize: 12, fontWeight: 700, color: "#111827" },
      { id: "totalMarks", label: "Total Marks", type: "text", x: 8, y: 82.5, w: 22, h: 3.2, fontSize: 12, fontWeight: 700, color: "#111827" },
      { id: "classTeacherSign", label: "Class Teacher", type: "text", x: 8, y: 92, w: 18, h: 2.5, fontSize: 11, fontWeight: 600, color: "#334155" },
      { id: "principalSign", label: "Principal", type: "text", x: 74, y: 92, w: 18, h: 2.5, fontSize: 11, fontWeight: 600, color: "#334155", align: "right" }
    ]
  },
  certificate: {
    width: 1600,
    height: 1131,
    fields: [
      { id: "schoolName", label: "School Name", type: "text", x: 16, y: 8, w: 68, h: 5.5, fontSize: 28, fontWeight: 800, color: "#0f172a", align: "center", uppercase: true },
      { id: "schoolAddress", label: "School Address", type: "text", x: 20, y: 14.2, w: 60, h: 3.4, fontSize: 14, fontWeight: 600, color: "#475569", align: "center" },
      { id: "certificateTitle", label: "Certificate Title", type: "text", x: 25, y: 24, w: 50, h: 5, fontSize: 26, fontWeight: 800, color: "#1d4ed8", align: "center", uppercase: true, letterSpacing: 1.8 },
      { id: "certificateBody", label: "Certificate Body", type: "text", x: 12, y: 38, w: 76, h: 28, fontSize: 15, fontWeight: 500, color: "#1f2937", align: "left" },
      { id: "studentName", label: "Student Name", type: "text", x: 24, y: 52, w: 52, h: 4, fontSize: 18, fontWeight: 800, color: "#111827", align: "center", uppercase: true },
      { id: "fatherName", label: "Father Name", type: "text", x: 24, y: 58, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" },
      { id: "className", label: "Class", type: "text", x: 24, y: 64, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" },
      { id: "studentCode", label: "Admission No.", type: "text", x: 24, y: 70, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" },
      { id: "issueDate", label: "Issue Date", type: "text", x: 12, y: 84, w: 20, h: 3, fontSize: 13, fontWeight: 700, color: "#334155" },
      { id: "principalSign", label: "Principal Sign", type: "text", x: 72, y: 84, w: 16, h: 3, fontSize: 13, fontWeight: 700, color: "#334155", align: "right" }
    ]
  }
}

export function getDefaultDocumentLayout(kind: DocumentKind): DocumentLayout {
  return JSON.parse(JSON.stringify(defaultLayouts[kind]))
}

export function normalizeDocumentLayout(kind: DocumentKind, value: unknown): DocumentLayout {
  const fallback = getDefaultDocumentLayout(kind)

  if (!value || typeof value !== "object") {
    return fallback
  }

  const candidate = value as Partial<DocumentLayout>
  const fields = Array.isArray(candidate.fields) ? candidate.fields : []

  if (!fields.length) {
    return fallback
  }

  return {
    width: typeof candidate.width === "number" && candidate.width > 0 ? candidate.width : fallback.width,
    height: typeof candidate.height === "number" && candidate.height > 0 ? candidate.height : fallback.height,
    fields: fields.map((field, index) => {
      const defaultField = fallback.fields[index] || fallback.fields[0]
      return {
        ...defaultField,
        ...(typeof field === "object" && field ? field : {})
      } as DocumentField
    })
  }
}

export function getCertificateBodyText(params: {
  type: "bonafide" | "tc"
  studentName: string
  fatherName: string
  className: string
  schoolName: string
  issueDate: string
  reason?: string
}) {
  if (params.type === "tc") {
    return `This is to certify that ${params.studentName}, child of ${params.fatherName}, was a bonafide student of ${params.schoolName} studying in ${params.className}. This Transfer Certificate is issued on ${params.issueDate}${params.reason ? ` for ${params.reason}` : ""}.`
  }

  return `This is to certify that ${params.studentName}, child of ${params.fatherName}, is a bonafide student of ${params.schoolName} and is presently studying in ${params.className}. This certificate is issued on ${params.issueDate}${params.reason ? ` for ${params.reason}` : ""}.`
}
