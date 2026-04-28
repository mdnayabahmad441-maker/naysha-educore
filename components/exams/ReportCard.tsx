"use client"

import DocumentCanvas from "@/components/documents/DocumentCanvas"
import { normalizeDocumentLayout, type DocumentLayout } from "@/lib/document-layouts"

interface Props {
  student: any
  report: any
  school: any
  exam: any
  classData: any
  templateUrl?: string | null
  layout?: DocumentLayout | null
}

export default function ReportCard({
  student,
  report,
  school,
  exam,
  classData,
  templateUrl,
  layout
}: Props) {
  if (!report) return null

  const activeLayout = normalizeDocumentLayout("report_card", layout)
  const values = {
    schoolName: school?.name || "School Name",
    reportTitle: `${exam?.name || "Exam"} Result`,
    studentName: `Name: ${student?.name || "-"}`,
    className: `Class: ${classData?.name || "-"}`,
    rollNumber: `Roll No: ${student?.roll_number || "-"}`,
    fatherName: `Father: ${student?.father_name || "-"}`,
    examName: `Exam: ${exam?.name || "-"}`,
    grade: `Grade: ${report.grade}`,
    percentage: `Percentage: ${report.percentage.toFixed(2)}%`,
    result: report.finalResult,
    totalMarks: `Total Marks: ${report.totalMarks}`,
    obtainedMarks: `Obtained Marks: ${report.obtainedMarks}`,
    remark: report.remark || "",
    classTeacherSign: "Class Teacher",
    principalSign: "Principal"
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <DocumentCanvas
        layout={activeLayout}
        backgroundUrl={templateUrl || null}
        values={values}
        rows={report.rows}
        className="w-full"
      />
    </div>
  )
}
