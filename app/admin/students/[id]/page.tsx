"use client"

import { useEffect, useState } from "react"
import { getActiveAcademicYear } from "@/lib/academic"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"

type StudentTab = "profile" | "attendance" | "payments" | "documents" | "reportcards"

type StudentRecord = {
  id: string
  name: string
  email: string | null
  photo: string | null
  student_code: string | null
}

type ParentRecord = {
  father_name: string | null
  mother_name: string | null
  email: string | null
  phone: string | null
  name: string | null
}

type EnrollmentRecord = {
  roll_number: number | null
  classes: {
    name: string
  } | null
}

type StudentDocument = {
  id: string
  document_type: string
  file_url: string
}

type AttendanceRecord = {
  id: string
  date: string
  status: string
}

type PaymentRecord = {
  id: string
  date: string
  amount: number
}

type ReportRecord = {
  id: string
  created_at: string
  file_url: string
  exams: {
    name: string
  } | null
}

export default function StudentProfile() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const router = useRouter()

  const [tab, setTab] = useState<StudentTab>("profile")

  const [student, setStudent] = useState<StudentRecord | null>(null)
  const [parent, setParent] = useState<ParentRecord | null>(null)
  const [enrollment, setEnrollment] = useState<EnrollmentRecord | null>(null)
  const [documents, setDocuments] = useState<StudentDocument[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [reports, setReports] = useState<ReportRecord[]>([])

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      try {
        const roleData = await getUserRole()

        if (roleData?.role === "teacher") {
          router.replace("/unauthorized")
        }
      } catch (error) {
        console.error("Role error:", error)
      }
    }

    void checkRole()
  }, [router])

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const [schoolId, year] = await Promise.all([
          getSchoolId(),
          getActiveAcademicYear()
        ])

        if (!schoolId) {
          throw new Error("School not found")
        }

        let enrollmentQuery = supabase
          .from("student_enrollments")
          .select("roll_number, classes(name)")
          .eq("student_id", id)
          .eq("school_id", schoolId)

        if (year?.id) {
          enrollmentQuery = enrollmentQuery.eq("academic_year_id", year.id)
        }

        const [
          studentRes,
          parentRes,
          enrollmentRes,
          docRes,
          attendanceRes,
          paymentRes,
          reportRes
        ] = await Promise.all([
          supabase
            .from("students")
            .select("id,name,email,photo,student_code")
            .eq("id", id)
            .single(),

          supabase
            .from("parents")
            .select("father_name,mother_name,email,phone,name")
            .eq("student_id", id)
            .maybeSingle(),

          enrollmentQuery.maybeSingle(),

          supabase
            .from("student_documents")
            .select("id,document_type,file_url")
            .eq("student_id", id),

          supabase
            .from("attendance")
            .select("id,date,status")
            .eq("student_id", id)
            .order("date", { ascending: false }),

          supabase
            .from("payments")
            .select("id,date,amount")
            .eq("student_id", id)
            .order("date", { ascending: false }),

          supabase
            .from("report_cards")
            .select("id,created_at,file_url,exams(name)")
            .eq("student_id", id)
            .order("created_at", { ascending: false })
        ])

        if (studentRes.error) {
          throw studentRes.error
        }

        if (!cancelled) {
          setStudent(studentRes.data as StudentRecord | null)
          setParent((parentRes.data as ParentRecord | null) ?? null)
          setEnrollment((enrollmentRes.data as EnrollmentRecord | null) ?? null)
          setDocuments((docRes.data as StudentDocument[] | null) ?? [])
          setAttendance((attendanceRes.data as AttendanceRecord[] | null) ?? [])
          setPayments((paymentRes.data as PaymentRecord[] | null) ?? [])
          setReports((reportRes.data as ReportRecord[] | null) ?? [])
        }
      } catch (error) {
        console.error("Load error:", error)

        if (!cancelled) {
          setStudent(null)
          setParent(null)
          setEnrollment(null)
          setDocuments([])
          setAttendance([])
          setPayments([])
          setReports([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return <div className="animate-pulse p-10 text-white">Loading student data...</div>
  }

  if (!student) {
    return <div className="p-10 text-red-400">Student not found</div>
  }

  const className = enrollment?.classes?.name || "-"
  const rollNumber = enrollment?.roll_number || "-"

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white md:p-10">
      <div className="flex flex-col items-center gap-6 rounded-xl border border-white/10 bg-white/10 p-6 md:flex-row">
        {student.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={student.photo}
            alt={`${student.name} profile`}
            className="h-28 w-28 rounded-full border border-white/20 object-cover"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-2xl">
            Student
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold">{student.name}</h1>

          <p className="mt-1 text-gray-400">{student.email || "No email"}</p>

          <div className="mt-3 space-y-1 text-sm text-gray-300">
            <p>Student ID: {student.student_code || "-"}</p>
            <p>Roll: {rollNumber}</p>
            <p>Class: {className}</p>
          </div>

          <button
            onClick={() => router.push(`/admin/students/${id}/edit`)}
            className="mt-4 rounded bg-blue-600 px-4 py-2 text-sm hover:bg-blue-700"
          >
            Edit Student
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {(["profile", "attendance", "payments", "documents", "reportcards"] as StudentTab[]).map(
          (item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`rounded-xl border px-4 py-2 transition ${
                tab === item
                  ? "border-white/20 bg-white/20"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              {item.toUpperCase()}
            </button>
          )
        )}
      </div>

      {tab === "profile" && (
        <div className="space-y-6 rounded-xl bg-white/10 p-6">
          <div>
            <h2 className="mb-3 text-lg">Student Details</h2>
            <p>Name: {student.name}</p>
            <p>Email: {student.email || "-"}</p>
            <p>Student ID: {student.student_code || "-"}</p>
            <p>Roll: {rollNumber}</p>
            <p>Class: {className}</p>
          </div>

          <div>
            <h2 className="mb-3 text-lg">Parents</h2>
            <p>Father: {parent?.father_name || "-"}</p>
            <p>Mother: {parent?.mother_name || "-"}</p>
            <p>Phone: {parent?.phone || "-"}</p>
            <p>Email: {parent?.email || "-"}</p>
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="overflow-auto rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg">Attendance</h2>

          {attendance.length === 0 ? (
            <p className="text-gray-400">No attendance records</p>
          ) : (
            <table className="w-full border border-white/10 text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr key={record.id}>
                    <td className="border p-2">{record.date}</td>
                    <td className="border p-2">
                      {record.status === "present" ? "Present" : "Absent"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "payments" && (
        <div className="overflow-auto rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg">Payments</h2>

          {payments.length === 0 ? (
            <p className="text-gray-400">No payments found</p>
          ) : (
            <table className="w-full border border-white/10 text-sm">
              <thead>
                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="border p-2">{payment.date}</td>
                    <td className="border p-2">Rs. {payment.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "documents" && (
        <div className="rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg">Documents</h2>

          {documents.length === 0 ? (
            <p className="text-gray-400">No documents uploaded</p>
          ) : (
            documents.map((document) => (
              <a
                key={document.id}
                href={document.file_url}
                target="_blank"
                rel="noreferrer"
                className="mb-2 block text-blue-400 hover:underline"
              >
                {document.document_type}
              </a>
            ))
          )}
        </div>
      )}

      {tab === "reportcards" && (
        <div className="rounded-xl bg-white/10 p-6">
          <h2 className="mb-4 text-lg">Report Cards</h2>

          {reports.length === 0 ? (
            <p className="text-gray-400">No report cards generated yet</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3"
                >
                  <div>
                    <p className="font-medium">{report.exams?.name || "Exam"}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <a
                    href={report.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded bg-blue-600 px-3 py-1 text-sm"
                  >
                    View PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
