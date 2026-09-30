"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { getActiveAcademicYear } from "@/lib/academic"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRouter } from "next/navigation"
import { createRoot } from "react-dom/client"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type SchoolClass = {
  id: string
  name: string
}

type Student = {
  id: string
  name: string
  student_code?: string | null
  roll_number: string | null
  class_id: string | null
  student_type?: string | null
}

type FeeRecord = {
  id: string
  student_id: string
  class_id: string | null
  month: string
  total_amount: number | null
  paid_amount: number | null
  status: string
  created_at?: string | null
  tuition_fee?: number | null
  transport_fee?: number | null
  hostel_fee?: number | null
}

type FeeWithStudent = FeeRecord & {
  student: Student
}

type ClassFeeSetting = {
  tuition_fee: number | null
  transport_fee: number | null
  hostel_fee: number | null
}

const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

const UNKNOWN_STUDENT: Student = {
  id: "",
  name: "Unknown",
  roll_number: "-",
  class_id: null
}

async function fetchFees(
  schoolId: string,
  selectedClass: string,
  selectedMonth: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ fees: FeeWithStudent[]; totalCount: number }> {
  let query = supabase
    .from("fees")
    .select(
      "id,student_id,class_id,month,total_amount,paid_amount,status,created_at,tuition_fee,transport_fee,hostel_fee",
      { count: "exact" }
    )
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false })

  if (selectedClass) {
    query = query.eq("class_id", selectedClass)
  }

  if (selectedMonth) {
    query = query.eq("month", selectedMonth)
  }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: feeData, error: feeError, count } = await query

  if (feeError) {
    throw feeError
  }

  const fees = (feeData as FeeRecord[] | null) ?? []
  const totalCount = count ?? fees.length

  if (fees.length === 0) {
    return { fees: [], totalCount }
  }

  const studentIds = [...new Set(fees.map((fee) => fee.student_id))]

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id,name,student_code,roll_number,class_id")
    .in("id", studentIds)
    .eq("school_id", schoolId)

  if (studentsError) {
    throw studentsError
  }

  const studentMap = new Map<string, Student>()
  ;((students as Student[] | null) ?? []).forEach((student) => {
    studentMap.set(student.id, student)
  })

  const feesWithStudent = fees.map((fee) => ({
    ...fee,
    student: studentMap.get(fee.student_id) ?? UNKNOWN_STUDENT
  }))

  return { fees: feesWithStudent, totalCount }
}

type AiFeeReminder = {
  studentName: string
  amount: number
  message: string
}

type AiFeeReminders = {
  summary: string
  reminders: AiFeeReminder[]
}

export default function FeesPage() {
  const router = useRouter()
  const school = useSchool()

  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [fees, setFees] = useState<FeeWithStudent[]>([])
  const PAGE_SIZE = 50
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const [aiReminders, setAiReminders] = useState<AiFeeReminders | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    void supabase
      .from("classes")
      .select("id,name")
      .eq("school_id", schoolId)
      .then(({ data, error }) => {
        if (error) {
          console.error("Failed to load classes:", error)
          setClasses([])
          return
        }

        setClasses((data as SchoolClass[] | null) ?? [])
      })
  }, [schoolId])

  // Reset to page 1 when class or month filter changes
  useEffect(() => {
    setPage(1)
  }, [selectedClass, selectedMonth])

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false
    setLoading(true)

    void fetchFees(schoolId, selectedClass, selectedMonth, page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return
        setFees(result.fees)
        setTotalCount(result.totalCount)
      })
      .catch((error) => {
        console.error("Failed to load fees:", error)
        if (cancelled) return
        setFees([])
        setTotalCount(0)
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId, selectedClass, selectedMonth, page])

  const refreshFees = async () => {
    if (!schoolId) return

    setLoading(true)

    try {
      const result = await fetchFees(schoolId, selectedClass, selectedMonth, page, PAGE_SIZE)
      setFees(result.fees)
      setTotalCount(result.totalCount)
    } catch (error) {
      console.error("Failed to refresh fees:", error)
      setFees([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const generateReceipt = async (fee: FeeWithStudent) => {
    let container: HTMLDivElement | null = null
    let root: ReturnType<typeof createRoot> | null = null

    try {
      if (!schoolId) {
        alert("School not loaded")
        return
      }

      const activeYear = await getActiveAcademicYear()

      let enrollmentQuery = supabase
        .from("student_enrollments")
        .select("roll_number,class_id")
        .eq("student_id", fee.student_id)
        .eq("school_id", schoolId)

      if (activeYear?.id) {
        enrollmentQuery = enrollmentQuery.eq("academic_year_id", activeYear.id)
      }

      const [schoolRes, parentRes, enrollmentRes, paymentRes] =
        await Promise.all([
          supabase
            .from("schools")
            .select("name,address,phone,logo_url")
            .eq("id", schoolId)
            .maybeSingle(),

          supabase
            .from("parents")
            .select("name,father_name,mother_name,phone,email")
            .eq("student_id", fee.student_id)
            .eq("school_id", schoolId)
            .limit(1)
            .maybeSingle(),

          enrollmentQuery.limit(1).maybeSingle(),

          supabase
            .from("payments")
            .select("id,receipt_number,amount,date,payment_mode")
            .eq("fee_id", fee.id)
            .eq("school_id", schoolId)
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle()
        ])

      if (schoolRes.error) throw schoolRes.error
      if (parentRes.error) throw parentRes.error
      if (enrollmentRes.error) throw enrollmentRes.error
      if (paymentRes.error) throw paymentRes.error

      const enrollment = enrollmentRes.data
      const classId = enrollment?.class_id || fee.student.class_id || fee.class_id
      let className = "N/A"

      if (classId) {
        const { data: cls, error: classError } = await supabase
          .from("classes")
          .select("name")
          .eq("id", classId)
          .eq("school_id", schoolId)
          .maybeSingle()

        if (classError) throw classError
        className = cls?.name || "N/A"
      }

      const parent = parentRes.data
      const parentName =
        parent?.name ||
        parent?.father_name ||
        parent?.mother_name ||
        "N/A"
      const payment = paymentRes.data

      container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "-10000px"
      container.style.width = "800px"
      container.style.padding = "24px"
      container.style.background = "#ffffff"
      container.style.overflow = "visible"
      document.body.appendChild(container)

      root = createRoot(container)

      root.render(
        <FeeReceipt
          student={{
            ...fee.student,
            class_name: className,
            roll_number: enrollment?.roll_number ?? fee.student.roll_number ?? "N/A",
            parent_name: parentName,
            parent_phone: parent?.phone || "N/A",
            parent_email: parent?.email || "N/A"
          }}
          fee={fee}
          payment={{
            amount: payment?.amount ?? fee.paid_amount ?? 0,
            date: payment?.date ?? new Date().toISOString(),
            id: payment?.id ?? fee.id,
            receipt_number: payment?.receipt_number ?? fee.id,
            payment_mode: payment?.payment_mode ?? "cash"
          }}
          school={schoolRes.data}
          showActions={false}
        />
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
      await new Promise((resolve) => setTimeout(resolve, 120))

      const canvas = await html2canvas(container, {
        scale: 1.15,
        useCORS: true
      })

      const img = canvas.toDataURL("image/jpeg", 0.82)
      const pdf = new jsPDF("p", "mm", "a4")

      const maxWidth = 190
      const maxHeight = 281
      let width = maxWidth
      let height = (canvas.height * width) / canvas.width

      if (height > maxHeight) {
        height = maxHeight
        width = (canvas.width * height) / canvas.height
      }

      pdf.addImage(img, "JPEG", (210 - width) / 2, 8, width, height, undefined, "FAST")
      pdf.save(`receipt-${fee.id}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Receipt generation failed")
    } finally {
      root?.unmount()

      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
  }

  const generateFees = async () => {
    if (!schoolId) {
      alert("School not loaded")
      return
    }

    if (!selectedClass || !selectedMonth) {
      alert("Select class and month")
      return
    }

    setGenerating(true)

    try {
      const { data: classFee, error: classFeeError } = await supabase
        .from("class_fee_settings")
        .select("tuition_fee,transport_fee,hostel_fee")
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)
        .maybeSingle()

      if (classFeeError) {
        throw classFeeError
      }

      if (!classFee) {
        alert("Set class fees first")
        return
      }

      const settings = classFee as ClassFeeSetting
      const total =
        Number(settings.tuition_fee ?? 0) +
        Number(settings.transport_fee ?? 0) +
        Number(settings.hostel_fee ?? 0)

      if (total === 0) {
        alert("Fee is 0. Configure first")
        return
      }

      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select("id,class_id,student_type")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)

      if (studentsError) {
        throw studentsError
      }

      for (const student of
        ((students as Pick<Student, "id" | "class_id" | "student_type">[] | null) ?? [])) {
        const studentType = (student.student_type || "day_scholar").toLowerCase()
        const tuition = Number(settings.tuition_fee ?? 0)
        const transport = Number(settings.transport_fee ?? 0)
        const hostel = Number(settings.hostel_fee ?? 0)

        const payload = {
          student_id: student.id,
          school_id: schoolId,
          class_id: student.class_id,
          month: selectedMonth,
          total_amount: 0,
          paid_amount: 0,
          status: "pending",
          tuition_fee: 0,
          transport_fee: 0,
          hostel_fee: 0
        }

        if (studentType === "hosteler") {
          payload.tuition_fee = tuition
          payload.hostel_fee = hostel
          payload.total_amount = tuition + hostel
        } else if (studentType === "day_scholar_transport") {
          payload.tuition_fee = tuition
          payload.transport_fee = transport
          payload.total_amount = tuition + transport
        } else {
          payload.tuition_fee = tuition
          payload.total_amount = tuition
        }

        const { data: existing, error: existingError } = await supabase
          .from("fees")
          .select("id")
          .eq("student_id", student.id)
          .eq("month", selectedMonth)
          .eq("school_id", schoolId)
          .maybeSingle()

        if (existingError) {
          throw existingError
        }

        if (existing) continue

        const { error: insertError } = await supabase.from("fees").insert(payload)

        if (insertError) {
          throw insertError
        }
      }

      alert("Fees generated")
      await refreshFees()
    } catch (error) {
      console.error(error)
      alert("Failed to generate fees")
    } finally {
      setGenerating(false)
    }
  }

  const statusColor = (status: string) => {
    if (status === "paid") return "bg-green-500/20 text-green-400"
    if (status === "partial") return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  const generateAiReminders = async () => {
    if (!schoolId) return

    const pendingFees = fees
      .filter(f => f.status === "pending" || f.status === "partial")
      .map(f => ({
        studentName: f.student.name,
        amount: (f.total_amount ?? 0) - (f.paid_amount ?? 0),
        month: f.month
      }))

    if (pendingFees.length === 0) {
      alert("No pending fees to generate reminders for")
      return
    }

    setAiLoading(true)
    setAiReminders(null)

    try {
      const res = await apiFetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "fee_reminders",
          schoolId,
          schoolName: school?.name || "School",
          month: selectedMonth || "current month",
          pendingFees
        })
      })

      const json = await res.json()
      if (!res.ok || !json?.data) throw new Error(json?.error || "AI failed")
      setAiReminders(json.data as AiFeeReminders)
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI reminder generation failed")
    } finally {
      setAiLoading(false)
    }
  }

  const copyReminder = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
  }

  return (
    <div className="min-h-screen bg-[#020617] p-4 text-white md:p-6">
      <h1 className="mb-6 text-2xl font-semibold">Fees</h1>

      <button
        onClick={() => router.push("/admin/fees/receipts")}
        className="mb-4 rounded-xl bg-purple-600 px-4 py-2 hover:bg-purple-700"
      >
        Receipt History
      </button>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:grid-cols-4">
        <select
          value={selectedClass}
          onChange={(event) => {
            setLoading(true)
            setSelectedClass(event.target.value)
          }}
          className="input"
        >
          <option value="">Class</option>
          {classes.map((schoolClass) => (
            <option key={schoolClass.id} value={schoolClass.id}>
              {schoolClass.name}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(event) => {
            setLoading(true)
            setSelectedMonth(event.target.value)
          }}
          className="input"
        >
          <option value="">Month</option>
          {MONTH_OPTIONS.map((month) => (
            <option key={month}>{month}</option>
          ))}
        </select>

        <button onClick={generateFees} className="btn bg-blue-600">
          {generating ? "Generating..." : "Generate Fees"}
        </button>

        <button
          onClick={generateAiReminders}
          disabled={aiLoading}
          className="rounded-[10px] border border-cyan-400/20 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {aiLoading ? "Drafting..." : "✦ AI Reminders"}
        </button>
      </div>

      {/* AI FEE REMINDERS PANEL */}
      {aiReminders && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✦</span>
            <h2 className="font-semibold text-cyan-100">AI Fee Reminders</h2>
          </div>
          <p className="text-sm text-gray-300">{aiReminders.summary}</p>
          <div className="space-y-3">
            {aiReminders.reminders.map((r, i) => (
              <div key={i} className="rounded-xl bg-white/5 p-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{r.studentName}</p>
                    <span className="text-xs text-yellow-400">₹{r.amount} due</span>
                  </div>
                  <p className="text-sm text-gray-300">{r.message}</p>
                </div>
                <button
                  onClick={() => copyReminder(r.message, i)}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                >
                  {copiedIdx === i ? "Copied!" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {loading ? (
          "Loading..."
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th>Month</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>
              {fees.map((fee) => (
                <tr key={fee.id} className="border-t border-white/10">
                  <td className="p-3">{fee.student.name}</td>
                  <td>{fee.month}</td>
                  <td>Rs. {fee.total_amount ?? 0}</td>
                  <td>Rs. {fee.paid_amount ?? 0}</td>

                  <td>
                    <span
                      className={`rounded px-2 py-1 text-xs ${statusColor(fee.status)}`}
                    >
                      {fee.status}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => generateReceipt(fee)}
                      className="rounded bg-purple-600 px-3 py-1"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 text-sm text-gray-400">
        <p>
          Showing {fees.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
          {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount} records
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-2 text-xs">
            Page {page} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          </span>
          <button
            onClick={() => setPage((p) => (page < Math.ceil(totalCount / PAGE_SIZE) ? p + 1 : p))}
            disabled={page >= Math.ceil(totalCount / PAGE_SIZE) || loading}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>


      <style jsx>{`
        .input {
          background: #0f172a;
          padding: 10px;
          border-radius: 10px;
          width: 100%;
        }

        .btn {
          padding: 10px 16px;
          border-radius: 10px;
        }
      `}</style>
    </div>
  )
}
