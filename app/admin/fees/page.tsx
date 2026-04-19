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

const UNKNOWN_STUDENT: Student = {
  id: "",
  name: "Unknown",
  roll_number: "-",
  class_id: null
}

async function fetchFees(
  schoolId: string,
  selectedClass: string,
  selectedMonth: string
): Promise<FeeWithStudent[]> {
  let query = supabase
    .from("fees")
    .select(
      "id,student_id,class_id,month,total_amount,paid_amount,status,created_at,tuition_fee,transport_fee,hostel_fee"
    )
    .eq("school_id", schoolId)

  if (selectedClass) {
    query = query.eq("class_id", selectedClass)
  }

  if (selectedMonth) {
    query = query.eq("month", selectedMonth)
  }

  const { data: feeData, error: feeError } = await query

  if (feeError) {
    throw feeError
  }

  const fees = (feeData as FeeRecord[] | null) ?? []

  if (fees.length === 0) {
    return []
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

  return fees.map((fee) => ({
    ...fee,
    student: studentMap.get(fee.student_id) ?? UNKNOWN_STUDENT
  }))
}

export default function FeesPage() {
  const router = useRouter()

  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [classes, setClasses] = useState<SchoolClass[]>([])
  const [fees, setFees] = useState<FeeWithStudent[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

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

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false

    void fetchFees(schoolId, selectedClass, selectedMonth)
      .then((result) => {
        if (cancelled) return
        setFees(result)
      })
      .catch((error) => {
        console.error("Failed to load fees:", error)
        if (cancelled) return
        setFees([])
      })
      .finally(() => {
        if (cancelled) return
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [schoolId, selectedClass, selectedMonth])

  const refreshFees = async () => {
    if (!schoolId) return

    setLoading(true)

    try {
      const result = await fetchFees(schoolId, selectedClass, selectedMonth)
      setFees(result)
    } catch (error) {
      console.error("Failed to refresh fees:", error)
      setFees([])
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
            .select("name,address,phone")
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
      container.style.top = "-9999px"
      container.style.width = "800px"
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
        />
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)

      container.querySelectorAll<HTMLElement>("*").forEach((element) => {
        element.style.color = "#000"
        element.style.background = "#fff"
        element.style.borderColor = "#000"
        element.style.boxShadow = "none"
      })

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true
      })

      const img = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const width = 210
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img, "PNG", 0, 0, width, height)
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
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
        </select>

        <button onClick={generateFees} className="btn bg-blue-600">
          {generating ? "Generating..." : "Generate Fees"}
        </button>
      </div>

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
