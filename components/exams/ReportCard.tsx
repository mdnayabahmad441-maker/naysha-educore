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
    studentName: `Student's Name: ${student?.name || "-"}`,
    className: `Class: ${classData?.name || "-"}`,
    rollNumber: `Roll No: ${student?.roll_number || "-"}`,
    fatherName: `Father's Name: ${student?.father_name || "-"}`,
    examName: `Exam: ${exam?.name || "-"}`,
    grade: `Grade: ${report.grade}`,
    percentage: `Percentage: ${report.percentage.toFixed(2)}%`,
    result: `Result: ${report.finalResult}`,
    totalMarks: `Total Marks: ${report.totalMarks}`,
    obtainedMarks: `Obtained Marks: ${report.obtainedMarks}`,
    remark: `Teacher's Remarks: ${report.remark || ""}`,
    classTeacherSign: "Class Teacher's Signature",
    principalSign: "Principal / Director's Signature"
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
