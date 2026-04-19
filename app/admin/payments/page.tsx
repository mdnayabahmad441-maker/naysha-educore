"use client"

import { useEffect, useState } from "react"
import { getActiveAcademicYear } from "@/lib/academic"
import { getSchoolId } from "@/lib/school"
import { supabase } from "@/lib/supabase"

type StudentOption = {
  id: string
  name: string
  className: string | null
  rollNumber: number | null
}

type FeeOption = {
  id: string
  label: string
  totalAmount: number
  paidAmount: number
  status: "paid" | "partial" | "pending"
}

type PaymentRow = {
  id: string
  studentName: string
  studentClass: string | null
  receiptNumber: string
  feeLabel: string
  amount: number
  totalAmount: number
  progressPaid: number
  paymentDate: string
  status: "paid" | "partial" | "pending"
  isManual: boolean
  paymentMode: string
}

type Stats = {
  totalCollected: number
  totalPending: number
  thisMonth: number
  todayCount: number
}

type PaymentRecord = {
  id: string
  student_id: string
  fee_id: string
  amount: number | null
  receipt_number: string | null
  date: string | null
  is_manual: boolean | null
  payment_mode: string | null
}

type FeeRecord = {
  id: string
  student_id: string
  month: string | null
  total_amount: number | null
  paid_amount: number | null
  status: string | null
  tuition_fee: number | null
  transport_fee: number | null
  hostel_fee: number | null
}

type StudentRecord = {
  id: string
  name: string
}

type EnrollmentRecord = {
  student_id: string
  roll_number: number | null
  students:
    | {
        id: string
        name: string
      }[]
    | {
        id: string
        name: string
      }
    | null
  classes:
    | {
        name: string
      }[]
    | {
        name: string
      }
    | null
}

function getSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function initials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatINR(amount: number) {
  return "Rs. " + amount.toLocaleString("en-IN")
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

function toFeeLabel(fee: FeeRecord) {
  if (fee.month) {
    return `${fee.month} Fee`
  }

  const breakdown = [
    fee.tuition_fee ? "Tuition" : null,
    fee.transport_fee ? "Transport" : null,
    fee.hostel_fee ? "Hostel" : null
  ].filter(Boolean)

  if (breakdown.length > 0) {
    return breakdown.join(" + ")
  }

  return "Fee"
}

function normalizePaymentStatus(status: string | null | undefined): "paid" | "partial" | "pending" {
  if (status === "paid") return "paid"
  if (status === "partial") return "partial"
  return "pending"
}

function receiptNumberFromNow() {
  return `RCPT-${Date.now()}`
}

function StatCard({
  label,
  value,
  sub,
  color
}: {
  label: string
  value: string
  sub: string
  color?: string
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || "inherit" }}>
        {value}
      </div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: PaymentRow["status"] }) {
  const map: Record<PaymentRow["status"], string> = {
    paid: "badge-paid",
    partial: "badge-partial",
    pending: "badge-due"
  }

  return <span className={`badge ${map[status]}`}>{status}</span>
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const safeTotal = total > 0 ? total : 1
  const pct = Math.min(100, Math.round((paid / safeTotal) * 100))
  const color = pct === 100 ? "#639922" : pct > 50 ? "#185FA5" : "#BA7517"

  return (
    <div>
      <div className="progress-label">{pct}%</div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: pct + "%", background: color }}
        />
      </div>
    </div>
  )
}

async function fetchStudentOptions(schoolId: string): Promise<StudentOption[]> {
  const year = await getActiveAcademicYear()

  if (year?.id) {
    const { data, error } = await supabase
      .from("student_enrollments")
      .select(
        `
          student_id,
          roll_number,
          students(id,name),
          classes(name)
        `
      )
      .eq("school_id", schoolId)
      .eq("academic_year_id", year.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    const rows = ((data as EnrollmentRecord[] | null) ?? []).map((row) => {
      const student = getSingleRelation<{ id: string; name: string }>(row.students)
      const schoolClass = getSingleRelation<{ name: string }>(row.classes)

      return {
        id: student?.id || row.student_id,
        name: student?.name || "Unknown",
        className: schoolClass?.name || null,
        rollNumber: row.roll_number
      }
    })

    if (rows.length > 0) {
      return rows.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  const { data, error } = await supabase
    .from("students")
    .select("id,name")
    .eq("school_id", schoolId)
    .order("name")

  if (error) {
    throw error
  }

  return ((data as StudentRecord[] | null) ?? []).map((student) => ({
    id: student.id,
    name: student.name,
    className: null,
    rollNumber: null
  }))
}

async function fetchFeesForStudent(schoolId: string, studentId: string): Promise<FeeOption[]> {
  const { data, error } = await supabase
    .from("fees")
    .select(
      "id,student_id,month,total_amount,paid_amount,status,tuition_fee,transport_fee,hostel_fee"
    )
    .eq("student_id", studentId)
    .eq("school_id", schoolId)
    .neq("status", "paid")
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return ((data as FeeRecord[] | null) ?? []).map((fee) => ({
    id: fee.id,
    label: toFeeLabel(fee),
    totalAmount: Number(fee.total_amount ?? 0),
    paidAmount: Number(fee.paid_amount ?? 0),
    status: normalizePaymentStatus(fee.status)
  }))
}

async function fetchPaymentsForSchool(schoolId: string): Promise<PaymentRow[]> {
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select("id,student_id,fee_id,amount,receipt_number,date,is_manual,payment_mode")
    .eq("school_id", schoolId)
    .order("date", { ascending: false })
    .limit(100)

  if (paymentError) {
    throw paymentError
  }

  const payments = (paymentData as PaymentRecord[] | null) ?? []

  if (payments.length === 0) {
    return []
  }

  const studentIds = [...new Set(payments.map((payment) => payment.student_id))]
  const feeIds = [...new Set(payments.map((payment) => payment.fee_id))]
  const year = await getActiveAcademicYear()

  const [studentsRes, feesRes, enrollmentsRes] = await Promise.all([
    supabase
      .from("students")
      .select("id,name")
      .in("id", studentIds)
      .eq("school_id", schoolId),

    supabase
      .from("fees")
      .select(
        "id,student_id,month,total_amount,paid_amount,status,tuition_fee,transport_fee,hostel_fee"
      )
      .in("id", feeIds)
      .eq("school_id", schoolId),

    year?.id
      ? supabase
          .from("student_enrollments")
          .select(
            `
              student_id,
              roll_number,
              students(id,name),
              classes(name)
            `
          )
          .in("student_id", studentIds)
          .eq("school_id", schoolId)
          .eq("academic_year_id", year.id)
      : Promise.resolve({ data: [], error: null })
  ])

  if (studentsRes.error) {
    throw studentsRes.error
  }

  if (feesRes.error) {
    throw feesRes.error
  }

  if (enrollmentsRes.error) {
    throw enrollmentsRes.error
  }

  const studentMap = new Map<string, StudentRecord>()
  ;((studentsRes.data as StudentRecord[] | null) ?? []).forEach((student) => {
    studentMap.set(student.id, student)
  })

  const feeMap = new Map<string, FeeRecord>()
  ;((feesRes.data as FeeRecord[] | null) ?? []).forEach((fee) => {
    feeMap.set(fee.id, fee)
  })

  const classMap = new Map<string, string | null>()
  ;((enrollmentsRes.data as EnrollmentRecord[] | null) ?? []).forEach((row) => {
    const schoolClass = getSingleRelation<{ name: string }>(row.classes)
    classMap.set(row.student_id, schoolClass?.name || null)
  })

  return payments.map((payment) => {
    const student = studentMap.get(payment.student_id)
    const fee = feeMap.get(payment.fee_id)
    const totalAmount = Number(fee?.total_amount ?? 0)
    const progressPaid = Number(fee?.paid_amount ?? payment.amount ?? 0)

    return {
      id: payment.id,
      studentName: student?.name || "Unknown",
      studentClass: classMap.get(payment.student_id) || null,
      receiptNumber: payment.receipt_number || payment.id,
      feeLabel: fee ? toFeeLabel(fee) : "Fee",
      amount: Number(payment.amount ?? 0),
      totalAmount,
      progressPaid,
      paymentDate: payment.date || new Date().toISOString(),
      status: normalizePaymentStatus(fee?.status),
      isManual: Boolean(payment.is_manual),
      paymentMode: payment.payment_mode || "cash"
    }
  })
}

async function fetchPendingTotal(schoolId: string): Promise<number> {
  const { data, error } = await supabase
    .from("fees")
    .select("total_amount,paid_amount")
    .eq("school_id", schoolId)
    .neq("status", "paid")

  if (error) {
    throw error
  }

  return ((data as Pick<FeeRecord, "total_amount" | "paid_amount">[] | null) ?? []).reduce(
    (sum, fee) => sum + (Number(fee.total_amount ?? 0) - Number(fee.paid_amount ?? 0)),
    0
  )
}

async function computeStatsForSchool(
  schoolId: string,
  rows: PaymentRow[]
): Promise<Stats> {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const todayStr = todayISO()

  const totalCollected = rows.reduce((sum, row) => sum + row.amount, 0)
  const todayCount = rows.filter((row) => row.paymentDate.startsWith(todayStr)).length
  const monthlyTotal = rows
    .filter((row) => {
      const date = new Date(row.paymentDate)
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear
    })
    .reduce((sum, row) => sum + row.amount, 0)

  const totalPending = await fetchPendingTotal(schoolId)

  return {
    totalCollected,
    totalPending,
    thisMonth: monthlyTotal,
    todayCount
  }
}

export default function PaymentsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCollected: 0,
    totalPending: 0,
    thisMonth: 0,
    todayCount: 0
  })
  const [loadingTable, setLoadingTable] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  const [modalOpen, setModalOpen] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [fees, setFees] = useState<FeeOption[]>([])

  const [mStudentId, setMStudentId] = useState("")
  const [mFeeId, setMFeeId] = useState("")
  const [mAmount, setMAmount] = useState("")
  const [mDate, setMDate] = useState(todayISO())
  const [mMode, setMMode] = useState("cash")
  const [mRemarks, setMRemarks] = useState("")
  const [mLoading, setMLoading] = useState(false)
  const [isManualDate, setIsManualDate] = useState(false)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  const loadPayments = async () => {
    if (!schoolId) return

    setLoadingTable(true)

    try {
      const rows = await fetchPaymentsForSchool(schoolId)
      setPayments(rows)
      setStats(await computeStatsForSchool(schoolId, rows))
    } catch (error) {
      console.error("Failed to load payments:", error)
      setPayments([])
      setStats({
        totalCollected: 0,
        totalPending: 0,
        thisMonth: 0,
        todayCount: 0
      })
    } finally {
      setLoadingTable(false)
    }
  }

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false

    const load = async () => {
      try {
        const [paymentRows, studentRows] = await Promise.all([
          fetchPaymentsForSchool(schoolId),
          fetchStudentOptions(schoolId)
        ])

        if (cancelled) return

        setPayments(paymentRows)
        setStudents(studentRows)

        try {
          setStats(await computeStatsForSchool(schoolId, paymentRows))
        } catch (error) {
          console.error("Failed to compute stats:", error)
          if (!cancelled) {
            setStats({
              totalCollected: 0,
              totalPending: 0,
              thisMonth: 0,
              todayCount: 0
            })
          }
        }
      } catch (error) {
        console.error("Failed to initialize payments page:", error)

        if (cancelled) return

        setPayments([])
        setStudents([])
        setStats({
          totalCollected: 0,
          totalPending: 0,
          thisMonth: 0,
          todayCount: 0
        })
      } finally {
        if (!cancelled) {
          setLoadingTable(false)
        }
      }
    }

    setLoadingTable(true)
    void load()

    return () => {
      cancelled = true
    }
  }, [schoolId])

  const filteredPayments = payments.filter((payment) => {
    const query = search.trim().toLowerCase()

    if (
      query &&
      !payment.studentName.toLowerCase().includes(query) &&
      !payment.receiptNumber.toLowerCase().includes(query) &&
      !payment.feeLabel.toLowerCase().includes(query)
    ) {
      return false
    }

    if (statusFilter && payment.status !== statusFilter) {
      return false
    }

    if (monthFilter) {
      const date = new Date(payment.paymentDate)
      if (date.toLocaleString("en-IN", { month: "long" }) !== monthFilter) {
        return false
      }
    }

    return true
  })

  const loadFees = async (studentId: string) => {
    setMFeeId("")
    setMAmount("")
    setFees([])

    if (!studentId || !schoolId) return

    try {
      const rows = await fetchFeesForStudent(schoolId, studentId)
      setFees(rows)
    } catch (error) {
      console.error("Failed to load fees:", error)
      setFees([])
    }
  }

  const handleFeeChange = (feeId: string) => {
    setMFeeId(feeId)

    const fee = fees.find((item) => item.id === feeId)
    if (fee) {
      setMAmount(String(fee.totalAmount - fee.paidAmount))
    }
  }

  const handleDateChange = (value: string) => {
    setMDate(value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setIsManualDate(new Date(value) < today)
  }

  const resetModal = () => {
    setMStudentId("")
    setMFeeId("")
    setMAmount("")
    setMDate(todayISO())
    setMMode("cash")
    setMRemarks("")
    setIsManualDate(false)
    setFees([])
  }

  const save = async () => {
    if (!schoolId) {
      alert("School not loaded.")
      return
    }

    if (!mStudentId || !mFeeId || !mAmount) {
      alert("Please fill in all required fields.")
      return
    }

    const payAmount = Number(mAmount)
    if (!Number.isFinite(payAmount) || payAmount <= 0) {
      alert("Enter a valid amount.")
      return
    }

    const selectedDate = mDate ? new Date(mDate) : new Date()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) {
      alert("Future payments are not allowed.")
      return
    }

    setMLoading(true)

    try {
      const fee = fees.find((item) => item.id === mFeeId)

      if (!fee) {
        alert("Fee not found.")
        return
      }

      const remaining = fee.totalAmount - fee.paidAmount
      if (payAmount > remaining) {
        alert(`Amount cannot exceed due amount (${formatINR(remaining)}).`)
        return
      }

      const receiptNumber = receiptNumberFromNow()
      const paymentId = crypto.randomUUID()
      const paymentDateIso = selectedDate.toISOString()
      const newPaid = fee.paidAmount + payAmount

      const { error: paymentError } = await supabase.from("payments").insert({
        id: paymentId,
        student_id: mStudentId,
        fee_id: mFeeId,
        amount: payAmount,
        school_id: schoolId,
        receipt_number: receiptNumber,
        date: paymentDateIso,
        is_manual: isManualDate,
        payment_mode: mMode,
        remarks: mRemarks.trim() || null
      })

      if (paymentError) {
        throw paymentError
      }

      const { error: feeError } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.totalAmount ? "paid" : "partial"
        })
        .eq("id", mFeeId)
        .eq("school_id", schoolId)

      if (feeError) {
        throw feeError
      }

      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "payment", refId: paymentId })
        })
      } catch (error) {
        console.error("Notify failed:", error)
      }

      resetModal()
      setModalOpen(false)
      await loadPayments()

      alert(
        `Payment recorded successfully!\n\nReceipt: ${receiptNumber}\nAmount: ${formatINR(payAmount)}${
          isManualDate ? "\n\nSaved as manual back-dated entry." : ""
        }`
      )
    } catch (error) {
      console.error(error)
      alert("Something went wrong. Please try again.")
    } finally {
      setMLoading(false)
    }
  }

  return (
    <>
      <style>{css}</style>

      <div className="pay-page">
        <div className="pay-top">
          <div>
            <h1 className="pay-title">Fee Payments</h1>
            <p className="pay-sub">Manage and record student fee payments</p>
          </div>

          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record Payment
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total collected"
            value={formatINR(stats.totalCollected)}
            sub="Recent recorded payments"
            color="#185FA5"
          />
          <StatCard
            label="Pending dues"
            value={formatINR(stats.totalPending)}
            sub="Outstanding fees"
            color="#A32D2D"
          />
          <StatCard
            label="This month"
            value={formatINR(stats.thisMonth)}
            sub={new Date().toLocaleString("en-IN", {
              month: "long",
              year: "numeric"
            })}
            color="#3B6D11"
          />
          <StatCard
            label="Payments today"
            value={String(stats.todayCount)}
            sub="Recorded entries"
          />
        </div>

        <div className="pay-card">
          <div className="card-header">
            <div className="card-title">Payment records</div>

            <div className="filter-row">
              <input
                className="search-input"
                placeholder="Search student or receipt..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <select
                className="filter-select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">All status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>

              <select
                className="filter-select"
                value={monthFilter}
                onChange={(event) => setMonthFilter(event.target.value)}
              >
                <option value="">All months</option>
                {[
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
                ].map((month) => (
                  <option key={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            {loadingTable ? (
              <div className="table-empty">Loading payments...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="table-empty">No payment records found.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Receipt No.</th>
                    <th>Fee</th>
                    <th>Paid</th>
                    <th>Total</th>
                    <th>Progress</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>
                        <div className="student-cell">
                          <div className="avatar">{initials(payment.studentName)}</div>
                          <div>
                            <span className="student-name">{payment.studentName}</span>
                            {payment.studentClass && (
                              <div className="student-sub">{payment.studentClass}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="receipt">{payment.receiptNumber}</span>
                        {payment.isManual && (
                          <span className="badge badge-manual" style={{ marginLeft: 6 }}>
                            Manual
                          </span>
                        )}
                      </td>

                      <td className="muted">{payment.feeLabel}</td>
                      <td className="bold">{formatINR(payment.amount)}</td>
                      <td className="muted">{formatINR(payment.totalAmount)}</td>

                      <td style={{ minWidth: 100 }}>
                        <ProgressBar
                          paid={payment.progressPaid}
                          total={payment.totalAmount}
                        />
                      </td>

                      <td className="muted nowrap">{formatDate(payment.paymentDate)}</td>
                      <td className="muted capitalize">{payment.paymentMode}</td>
                      <td>
                        <StatusBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <div
          className="overlay"
          onClick={() => {
            setModalOpen(false)
            resetModal()
          }}
        >
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Record Payment</span>
              <button
                className="close-btn"
                onClick={() => {
                  setModalOpen(false)
                  resetModal()
                }}
              >
                &#x2715;
              </button>
            </div>

            {isManualDate && (
              <div className="notice notice-manual">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                This will be saved as a manual back-dated entry.
              </div>
            )}

            <div className="form-row">
              <label>Student</label>
              <select
                className="form-control"
                value={mStudentId}
                onChange={(event) => {
                  setMStudentId(event.target.value)
                  void loadFees(event.target.value)
                }}
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                    {student.className ? ` - ${student.className}` : ""}
                    {student.rollNumber ? ` (Roll ${student.rollNumber})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Fee Type</label>
              <select
                className="form-control"
                value={mFeeId}
                onChange={(event) => handleFeeChange(event.target.value)}
                disabled={!mStudentId}
              >
                <option value="">Select fee</option>
                {fees.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.label} - {formatINR(fee.totalAmount - fee.paidAmount)} due
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Amount (Rs.)</label>
                <input
                  type="number"
                  className="form-control"
                  value={mAmount}
                  onChange={(event) => setMAmount(event.target.value)}
                  placeholder="0"
                  min="1"
                />
              </div>

              <div className="form-row">
                <label>Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={mDate}
                  max={todayISO()}
                  onChange={(event) => handleDateChange(event.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Payment Mode</label>
              <select
                className="form-control"
                value={mMode}
                onChange={(event) => setMMode(event.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="form-row">
              <label>Remarks (optional)</label>
              <input
                type="text"
                className="form-control"
                value={mRemarks}
                onChange={(event) => setMRemarks(event.target.value)}
                placeholder="e.g. Paid by parent at front desk"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setModalOpen(false)
                  resetModal()
                }}
              >
                Cancel
              </button>

              <button className="btn-primary" onClick={save} disabled={mLoading}>
                {mLoading ? (
                  "Processing..."
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirm Payment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const css = `
.pay-page { padding: 24px; max-width: 1200px; margin: 0 auto; color: #f1f5f9; }
.pay-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.pay-title { font-size: 20px; font-weight: 600; color: #f1f5f9; }
.pay-sub { font-size: 13px; color: #64748b; margin-top: 2px; }

.btn-primary { display: inline-flex; align-items: center; gap: 6px; background: #185FA5; color: #fff; border: none; border-radius: 8px; padding: 9px 18px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background .15s; white-space: nowrap; }
.btn-primary:hover { background: #0C447C; }
.btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.btn-secondary { background: transparent; border: 1px solid #334155; border-radius: 8px; padding: 9px 18px; font-size: 14px; cursor: pointer; color: #cbd5e1; }
.btn-secondary:hover { background: #1e293b; }

.stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #1e293b; border-radius: 10px; padding: 16px; }
.stat-label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
.stat-value { font-size: 22px; font-weight: 600; }
.stat-sub { font-size: 12px; color: #475569; margin-top: 4px; }

.pay-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.card-title { font-size: 15px; font-weight: 600; color: #f1f5f9; }
.filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.search-input { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 7px 12px; font-size: 13px; color: #f1f5f9; width: 200px; }
.search-input:focus { outline: none; border-color: #185FA5; }
.filter-select { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 7px 10px; font-size: 13px; color: #f1f5f9; cursor: pointer; }

.table-wrap { overflow-x: auto; }
.table-empty { text-align: center; padding: 48px; color: #475569; font-size: 14px; }

table { width: 100%; border-collapse: collapse; font-size: 13px; }
thead tr { border-bottom: 1px solid #334155; }
th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
td { padding: 12px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: #0f172a; }

.muted { color: #64748b; }
.bold { font-weight: 600; color: #f1f5f9; }
.nowrap { white-space: nowrap; }
.capitalize { text-transform: capitalize; }

.student-cell { display: flex; align-items: center; gap: 10px; }
.avatar { width: 30px; height: 30px; border-radius: 50%; background: #2e1065; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: #a78bfa; flex-shrink: 0; }
.student-name { font-weight: 500; color: #f1f5f9; white-space: nowrap; }
.student-sub { font-size: 11px; color: #64748b; }
.receipt { color: #38bdf8; font-size: 12px; }

.badge { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 20px; font-size: 11px; font-weight: 500; white-space: nowrap; }
.badge-paid { background: #14532d; color: #86efac; }
.badge-partial { background: #431407; color: #fdba74; }
.badge-due { background: #450a0a; color: #fca5a5; }
.badge-manual { background: #0c2a4a; color: #7dd3fc; }

.progress-label { font-size: 11px; color: #64748b; margin-bottom: 3px; }
.progress-track { width: 100%; background: #0f172a; border-radius: 20px; height: 4px; }
.progress-fill { height: 4px; border-radius: 20px; transition: width .3s; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e293b; border: 1px solid #334155; border-radius: 14px; width: 460px; max-width: calc(100vw - 32px); padding: 24px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }
.close-btn { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; padding: 2px 6px; border-radius: 4px; }
.close-btn:hover { background: #334155; color: #f1f5f9; }

.notice { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
.notice-manual { background: #431407; color: #fdba74; }

.form-row { margin-bottom: 14px; }
.form-row label { display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 5px; text-transform: uppercase; letter-spacing: .4px; }
.form-control { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; font-size: 14px; color: #f1f5f9; }
.form-control:focus { outline: none; border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,.2); }
.form-control:disabled { opacity: .5; cursor: not-allowed; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #334155; }
`
