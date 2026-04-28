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

export type IdCardPreset = {
  id: string
  name: string
  description: string
  accent: string
  layout: DocumentLayout
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

function createIdCardLayout(fields: DocumentField[]): DocumentLayout {
  return {
    width: 1054,
    height: 1536,
    fields
  }
}

export const ID_CARD_PRESETS: IdCardPreset[] = [
  {
    id: "classic-blue",
    name: "Classic Blue",
    description: "Formal school card with a centered badge layout.",
    accent: "linear-gradient(135deg,#1d4ed8,#22d3ee)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 8, y: 5.5, w: 14, h: 9.5, borderRadius: 18, borderColor: "#1e3a8a" },
      { id: "schoolName", label: "School Name", type: "text", x: 24, y: 5.6, w: 68, h: 5.6, fontSize: 24, fontWeight: 800, color: "#1e3a8a", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 24, y: 11.8, w: 68, h: 3.8, fontSize: 11, fontWeight: 700, color: "#334155", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 25, y: 22, w: 50, h: 34, borderRadius: 28, borderColor: "#1e3a8a" },
      { id: "studentName", label: "Student Name", type: "text", x: 10, y: 60.5, w: 80, h: 5, fontSize: 18, fontWeight: 800, color: "#0f172a", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 30, y: 67.2, w: 40, h: 4.2, fontSize: 11, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#1d4ed8", bgOpacity: 0.96, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 12, y: 76, w: 76, h: 4.2, fontSize: 12, fontWeight: 700, color: "#1e293b" },
      { id: "className", label: "Course / Class", type: "text", x: 12, y: 81.5, w: 76, h: 4, fontSize: 12, fontWeight: 700, color: "#1e293b" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 12, y: 87, w: 76, h: 4, fontSize: 12, fontWeight: 700, color: "#1e293b" },
      { id: "studentPhone", label: "Phone", type: "text", x: 12, y: 92, w: 76, h: 3.8, fontSize: 11, fontWeight: 700, color: "#1e293b" }
    ])
  },
  {
    id: "emerald-stripe",
    name: "Emerald Stripe",
    description: "Vertical card with strong left branding and compact details.",
    accent: "linear-gradient(135deg,#059669,#34d399)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 9, y: 6, w: 18, h: 11, borderRadius: 20, borderColor: "#065f46" },
      { id: "schoolName", label: "School Name", type: "text", x: 30, y: 6.5, w: 58, h: 6, fontSize: 22, fontWeight: 800, color: "#065f46", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 30, y: 12.6, w: 58, h: 3.6, fontSize: 11, fontWeight: 700, color: "#475569" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 14, y: 26, w: 28, h: 38, borderRadius: 24, borderColor: "#059669" },
      { id: "studentName", label: "Student Name", type: "text", x: 46, y: 28.4, w: 38, h: 9, fontSize: 18, fontWeight: 800, color: "#064e3b", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 46, y: 40, w: 28, h: 4.2, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#059669", bgOpacity: 0.95, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 12, y: 73, w: 76, h: 4.2, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "className", label: "Course / Class", type: "text", x: 12, y: 79, w: 76, h: 4.2, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 12, y: 85, w: 76, h: 4.2, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "studentPhone", label: "Phone", type: "text", x: 12, y: 91, w: 76, h: 3.8, fontSize: 11, fontWeight: 700, color: "#0f172a" }
    ])
  },
  {
    id: "sunrise-band",
    name: "Sunrise Band",
    description: "Warm top band with large portrait framing.",
    accent: "linear-gradient(135deg,#f97316,#fb7185)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 10, y: 6.4, w: 14, h: 9.5, borderRadius: 18, borderColor: "#c2410c" },
      { id: "schoolName", label: "School Name", type: "text", x: 26, y: 6.2, w: 64, h: 5.8, fontSize: 23, fontWeight: 800, color: "#9a3412", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 18, y: 13, w: 72, h: 3.5, fontSize: 11, fontWeight: 700, color: "#7c2d12", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 18, y: 24, w: 64, h: 35, borderRadius: 24, borderColor: "#ea580c" },
      { id: "studentName", label: "Student Name", type: "text", x: 12, y: 63.5, w: 76, h: 5.2, fontSize: 18, fontWeight: 800, color: "#7c2d12", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 32, y: 70.2, w: 36, h: 4.3, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#f97316", bgOpacity: 0.95, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 14, y: 78, w: 72, h: 4.2, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "className", label: "Course / Class", type: "text", x: 14, y: 83.5, w: 72, h: 4, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 14, y: 89, w: 72, h: 4, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentPhone", label: "Phone", type: "text", x: 14, y: 94, w: 72, h: 3.6, fontSize: 11, fontWeight: 700, color: "#1f2937" }
    ])
  },
  {
    id: "royal-frame",
    name: "Royal Frame",
    description: "Ceremonial card with framed portrait and bold title block.",
    accent: "linear-gradient(135deg,#6d28d9,#2563eb)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 41, y: 5.4, w: 18, h: 11, borderRadius: 999, borderColor: "#5b21b6" },
      { id: "schoolName", label: "School Name", type: "text", x: 12, y: 17.8, w: 76, h: 5.6, fontSize: 24, fontWeight: 800, color: "#312e81", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 14, y: 24.2, w: 72, h: 3.6, fontSize: 11, fontWeight: 700, color: "#475569", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 22, y: 31.2, w: 56, h: 28, borderRadius: 12, borderColor: "#4f46e5" },
      { id: "studentName", label: "Student Name", type: "text", x: 14, y: 63.8, w: 72, h: 5.2, fontSize: 18, fontWeight: 800, color: "#312e81", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 34, y: 70.3, w: 32, h: 4, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#4338ca", bgOpacity: 0.95, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 16, y: 78.3, w: 68, h: 4.1, fontSize: 12, fontWeight: 700, color: "#111827" },
      { id: "className", label: "Course / Class", type: "text", x: 16, y: 83.6, w: 68, h: 4.1, fontSize: 12, fontWeight: 700, color: "#111827" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 16, y: 88.9, w: 68, h: 4.1, fontSize: 12, fontWeight: 700, color: "#111827" },
      { id: "studentPhone", label: "Phone", type: "text", x: 16, y: 94, w: 68, h: 3.6, fontSize: 11, fontWeight: 700, color: "#111827" }
    ])
  },
  {
    id: "slate-minimal",
    name: "Slate Minimal",
    description: "Clean modern look with compact branding and strong hierarchy.",
    accent: "linear-gradient(135deg,#334155,#0f172a)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 8, y: 7, w: 12, h: 8.2, borderRadius: 16, borderColor: "#0f172a" },
      { id: "schoolName", label: "School Name", type: "text", x: 22, y: 7, w: 66, h: 5.2, fontSize: 22, fontWeight: 800, color: "#0f172a", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 22, y: 12.8, w: 66, h: 3.3, fontSize: 10, fontWeight: 700, color: "#475569" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 10, y: 24, w: 32, h: 42, borderRadius: 18, borderColor: "#334155" },
      { id: "studentName", label: "Student Name", type: "text", x: 46, y: 27, w: 38, h: 9.5, fontSize: 18, fontWeight: 800, color: "#0f172a", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 46, y: 38.8, w: 24, h: 4.1, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#0f172a", bgOpacity: 0.96, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 12, y: 73, w: 74, h: 4, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "className", label: "Course / Class", type: "text", x: 12, y: 78.3, w: 74, h: 4, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 12, y: 83.6, w: 74, h: 4, fontSize: 12, fontWeight: 700, color: "#0f172a" },
      { id: "studentPhone", label: "Phone", type: "text", x: 12, y: 89, w: 74, h: 3.7, fontSize: 11, fontWeight: 700, color: "#0f172a" }
    ])
  },
  {
    id: "crimson-shield",
    name: "Crimson Shield",
    description: "High-contrast identity card with strong badge treatment.",
    accent: "linear-gradient(135deg,#b91c1c,#ef4444)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 38, y: 5.8, w: 24, h: 10, borderRadius: 999, borderColor: "#991b1b" },
      { id: "schoolName", label: "School Name", type: "text", x: 10, y: 18.5, w: 80, h: 5.5, fontSize: 24, fontWeight: 800, color: "#991b1b", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 14, y: 25, w: 72, h: 3.4, fontSize: 11, fontWeight: 700, color: "#475569", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 24, y: 33, w: 52, h: 27, borderRadius: 999, borderColor: "#dc2626" },
      { id: "studentName", label: "Student Name", type: "text", x: 12, y: 64.2, w: 76, h: 5.2, fontSize: 18, fontWeight: 800, color: "#7f1d1d", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 35, y: 70.8, w: 30, h: 4.2, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#b91c1c", bgOpacity: 0.95, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 14, y: 78.6, w: 72, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "className", label: "Course / Class", type: "text", x: 14, y: 84, w: 72, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 14, y: 89.3, w: 72, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentPhone", label: "Phone", type: "text", x: 14, y: 94.5, w: 72, h: 3.5, fontSize: 11, fontWeight: 700, color: "#1f2937" }
    ])
  },
  {
    id: "teal-campus",
    name: "Teal Campus",
    description: "Friendly modern card with broad image block and open spacing.",
    accent: "linear-gradient(135deg,#0f766e,#14b8a6)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 11, y: 6, w: 13, h: 9, borderRadius: 16, borderColor: "#0f766e" },
      { id: "schoolName", label: "School Name", type: "text", x: 26, y: 6.4, w: 60, h: 5.2, fontSize: 22, fontWeight: 800, color: "#115e59", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 26, y: 12.2, w: 60, h: 3.4, fontSize: 10.5, fontWeight: 700, color: "#475569" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 12, y: 23.5, w: 76, h: 31, borderRadius: 20, borderColor: "#14b8a6" },
      { id: "studentName", label: "Student Name", type: "text", x: 12, y: 58.5, w: 76, h: 5.2, fontSize: 18, fontWeight: 800, color: "#115e59", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 37, y: 65.4, w: 26, h: 4, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#0f766e", bgOpacity: 0.96, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 13, y: 75, w: 74, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "className", label: "Course / Class", type: "text", x: 13, y: 80.5, w: 74, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 13, y: 86, w: 74, h: 4.1, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentPhone", label: "Phone", type: "text", x: 13, y: 91.5, w: 74, h: 3.7, fontSize: 11, fontWeight: 700, color: "#1f2937" }
    ])
  },
  {
    id: "golden-hall",
    name: "Golden Hall",
    description: "Prestige-style card with premium centered composition.",
    accent: "linear-gradient(135deg,#a16207,#f59e0b)",
    layout: createIdCardLayout([
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 42, y: 5.2, w: 16, h: 10, borderRadius: 999, borderColor: "#a16207" },
      { id: "schoolName", label: "School Name", type: "text", x: 12, y: 17.4, w: 76, h: 5.8, fontSize: 24, fontWeight: 800, color: "#854d0e", align: "center", uppercase: true },
      { id: "schoolLocation", label: "School Address", type: "text", x: 18, y: 24, w: 64, h: 3.4, fontSize: 11, fontWeight: 700, color: "#57534e", align: "center" },
      { id: "studentPhoto", label: "Student Photo", type: "photo", x: 26, y: 31, w: 48, h: 31, borderRadius: 16, borderColor: "#f59e0b" },
      { id: "studentName", label: "Student Name", type: "text", x: 12, y: 66.3, w: 76, h: 5.2, fontSize: 18, fontWeight: 800, color: "#78350f", align: "center", uppercase: true },
      { id: "rollBadge", label: "Roll Badge", type: "text", x: 34, y: 72.8, w: 32, h: 4.1, fontSize: 10, fontWeight: 800, color: "#ffffff", align: "center", uppercase: true, bgColor: "#a16207", bgOpacity: 0.96, borderRadius: 999 },
      { id: "fatherName", label: "Father Name", type: "text", x: 14, y: 80.2, w: 72, h: 4, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "className", label: "Course / Class", type: "text", x: 14, y: 85.4, w: 72, h: 4, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentCode", label: "Enrollment No.", type: "text", x: 14, y: 90.7, w: 72, h: 4, fontSize: 12, fontWeight: 700, color: "#1f2937" },
      { id: "studentPhone", label: "Phone", type: "text", x: 14, y: 95.5, w: 72, h: 3.1, fontSize: 10.5, fontWeight: 700, color: "#1f2937" }
    ])
  }
]

export function getIdCardPresetById(presetId: string | null | undefined) {
  return ID_CARD_PRESETS.find((preset) => preset.id === presetId) || ID_CARD_PRESETS[0]
}

const defaultLayouts: Record<DocumentKind, DocumentLayout> = {
  id_card: ID_CARD_PRESETS[0].layout,
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
      { id: "remark", label: "Teacher Remark", type: "text", x: 34, y: 77.8, w: 58, h: 8.8, fontSize: 11, fontWeight: 600, color: "#1f2937" },
      { id: "classTeacherSign", label: "Class Teacher", type: "text", x: 8, y: 92, w: 18, h: 2.5, fontSize: 11, fontWeight: 600, color: "#334155" },
      { id: "principalSign", label: "Principal", type: "text", x: 74, y: 92, w: 18, h: 2.5, fontSize: 11, fontWeight: 600, color: "#334155", align: "right" }
    ]
  },
  certificate: {
    width: 1600,
    height: 1131,
    fields: [
      { id: "schoolLogo", label: "School Logo", type: "photo", x: 4, y: 3.5, w: 10, h: 18, borderRadius: 8, borderColor: "#e2e8f0" },
      { id: "schoolName", label: "School Name", type: "text", x: 17, y: 6, w: 66, h: 6.5, fontSize: 28, fontWeight: 800, color: "#0f172a", align: "center", uppercase: true },
      { id: "schoolAddress", label: "School Address", type: "text", x: 17, y: 13.5, w: 66, h: 4, fontSize: 14, fontWeight: 600, color: "#475569", align: "center" },
      { id: "certificateTitle", label: "Certificate Title", type: "text", x: 22, y: 23, w: 56, h: 6, fontSize: 26, fontWeight: 800, color: "#1d4ed8", align: "center", uppercase: true, letterSpacing: 1.8 },
      { id: "certificateBody", label: "Certificate Body", type: "text", x: 8, y: 33, w: 84, h: 40, fontSize: 15, fontWeight: 500, color: "#1f2937", align: "left" },
      { id: "issueDate", label: "Issue Date", type: "text", x: 8, y: 83, w: 22, h: 4, fontSize: 13, fontWeight: 700, color: "#334155" },
      { id: "principalSign", label: "Principal Sign", type: "text", x: 70, y: 83, w: 22, h: 4, fontSize: 13, fontWeight: 700, color: "#334155", align: "right" },
      { id: "studentName", label: "Student Name", type: "text", x: 24, y: 110, w: 52, h: 4, fontSize: 18, fontWeight: 800, color: "#111827", align: "center", uppercase: true },
      { id: "fatherName", label: "Father Name", type: "text", x: 24, y: 116, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" },
      { id: "className", label: "Class", type: "text", x: 24, y: 122, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" },
      { id: "studentCode", label: "Admission No.", type: "text", x: 24, y: 128, w: 52, h: 3.6, fontSize: 15, fontWeight: 700, color: "#111827", align: "center" }
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

  const candidateMap = new Map(
    fields
      .filter((field) => typeof field === "object" && field !== null)
      .map((field) => {
        const candidateField = field as unknown as Record<string, unknown>
        return [String(candidateField.id || ""), candidateField]
      })
  )

  return {
    width: typeof candidate.width === "number" && candidate.width > 0 ? candidate.width : fallback.width,
    height: typeof candidate.height === "number" && candidate.height > 0 ? candidate.height : fallback.height,
    fields: fallback.fields.map((defaultField) => ({
      ...defaultField,
      ...(candidateMap.get(defaultField.id) || {})
    }))
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
