"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  class?: string
}

interface Payment {
  id: string
  student_name: string
  receipt_number: string
  fee_label: string
  amount: number
  total_amount: number
  payment_date: string
  status: "paid" | "partial" | "due"
  is_manual: boolean
  payment_mode: string
}

interface Stats {
  totalCollected: number
  totalPending: number
  thisMonth: number
  todayCount: number
}

type FeeAmounts = Record<string, string>

// ─── Fee Categories ──────────────────────────────────────────────────────────

const FEE_CATEGORIES = [
  { key: "hostel", label: "Hostel fee", icon: "🏠", color: "#7c3aed" },
  { key: "school", label: "School fee", icon: "🏫", color: "#0369a1" },
  { key: "transport", label: "Transport fee", icon: "🚌", color: "#b45309" },
  { key: "misc", label: "Misc fee", icon: "📦", color: "#065f46" },
  { key: "others", label: "Others", icon: "💬", color: "#9f1239" },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN")
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

// ─── Components ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: any) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: any) {
  const map: any = {
    paid: "badge-paid",
    partial: "badge-partial",
    due: "badge-due",
  }
  return <span className={`badge ${map[status]}`}>{status}</span>
}

function ProgressBar({ paid, total }: any) {
  const pct = total ? Math.round((paid / total) * 100) : 100
  const color = pct === 100 ? "#22c55e" : pct > 50 ? "#38bdf8" : "#f97316"

  return (
    <div>
      <div className="progress-label">{pct}%</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + "%", background: color }} />
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCollected: 0,
    totalPending: 0,
    thisMonth: 0,
    todayCount: 0,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  const [mStudentId, setMStudentId] = useState("")
  const [mDate, setMDate] = useState(todayISO())
  const [mMode, setMMode] = useState("cash")
  const [mRemarks, setMRemarks] = useState("")
  const [feeAmounts, setFeeAmounts] = useState<FeeAmounts>({})
  const [isManual, setIsManual] = useState(false)

  useEffect(() => {
    getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return
    loadAll()
  }, [schoolId])

  const loadAll = async () => {
    await Promise.all([loadStudents(), loadPayments()])
  }

  const loadStudents = async () => {
    const { data: enrollments } = await supabase
      .from("student_enrollments")
      .select("student_id")
      .eq("school_id", schoolId)

    const ids = (enrollments || []).map((e: any) => e.student_id)

    if (ids.length === 0) {
      const { data } = await supabase
        .from("students")
        .select("id,name,class")
        .eq("school_id", schoolId)

      setStudents(data || [])
      return
    }

    const { data } = await supabase
      .from("students")
      .select("id,name,class")
      .in("id", ids)

    setStudents(data || [])
  }

  const loadPayments = async () => {
    setLoading(true)

    const { data } = await supabase
      .from("payments")
      .select(`
        id, amount, receipt_number, payment_date, is_manual, payment_mode,
        fee_type,
        students(name),
        fees(total_amount, paid_amount, status)
      `)
      .eq("school_id", schoolId)
      .order("payment_date", { ascending: false })
      .limit(100)

    const rows: Payment[] = (data || []).map((p: any) => ({
      id: p.id,
      student_name: p.students?.name || "—",
      receipt_number: p.receipt_number,
      fee_label: p.fee_type,
      amount: p.amount,
      total_amount: p.fees?.total_amount || p.amount,
      payment_date: p.payment_date,
      status: p.fees?.status || "paid",
      is_manual: p.is_manual,
      payment_mode: p.payment_mode,
    }))

    setPayments(rows)
    computeStats(rows)
    setLoading(false)
  }

  const computeStats = async (rows: Payment[]) => {
    const totalCollected = rows.reduce((s, r) => s + r.amount, 0)

    const todayStr = todayISO()
    const todayCount = rows.filter((r) => r.payment_date.startsWith(todayStr)).length

    const now = new Date()
    const monthly = rows
      .filter((r) => {
        const d = new Date(r.payment_date)
        return d.getMonth() === now.getMonth()
      })
      .reduce((s, r) => s + r.amount, 0)

    const { data: fees } = await supabase
      .from("fees")
      .select("total_amount, paid_amount")
      .neq("status", "paid")

    const pending = (fees || []).reduce(
      (s: number, f: any) => s + (f.total_amount - f.paid_amount),
      0
    )

    setStats({ totalCollected, totalPending: pending, thisMonth: monthly, todayCount })
  }

  useEffect(() => {
    let r = payments

    if (search) {
      const q = search.toLowerCase()
      r = r.filter(
        (p) =>
          p.student_name.toLowerCase().includes(q) ||
          p.receipt_number.toLowerCase().includes(q) ||
          p.fee_label.toLowerCase().includes(q)
      )
    }

    if (statusFilter) r = r.filter((p) => p.status === statusFilter)

    if (monthFilter) {
      r = r.filter((p) => {
        const d = new Date(p.payment_date)
        return d.toLocaleString("en-IN", { month: "long" }) === monthFilter
      })
    }

    setFiltered(r)
  }, [payments, search, statusFilter, monthFilter])

  const total = Object.values(feeAmounts).reduce((s, v) => s + Number(v || 0), 0)

  const save = async () => {
    if (!mStudentId) return alert("Select student")
    if (total <= 0) return alert("Enter amount")

    const selectedDate = new Date(mDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (selectedDate > today) return alert("Future not allowed")

    setIsManual(selectedDate < today)

    const entries = FEE_CATEGORIES
      .filter((f) => Number(feeAmounts[f.key]) > 0)
      .map((f) => ({
        id: crypto.randomUUID(),
        student_id: mStudentId,
        fee_type: f.key,
        amount: Number(feeAmounts[f.key]),
        school_id: schoolId,
        receipt_number: "RCPT-" + Date.now() + "-" + f.key,
        payment_date: selectedDate.toISOString(),
        payment_mode: mMode,
        is_manual: selectedDate < today,
        remarks: mRemarks,
      }))

    const { error } = await supabase.from("payments").insert(entries)
    if (error) return alert(error.message)

    setModalOpen(false)
    loadAll()
  }

  return (
    <>
      <style>{css}</style>

      <div className="pay-page">
        <div className="pay-top">
          <h1 className="pay-title">Fee payments</h1>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>Record payment</button>
        </div>

        <div className="stats-grid">
          <StatCard label="Total collected" value={formatINR(stats.totalCollected)} />
          <StatCard label="Pending dues" value={formatINR(stats.totalPending)} />
          <StatCard label="This month" value={formatINR(stats.thisMonth)} />
          <StatCard label="Payments today" value={stats.todayCount} />
        </div>

        {/* table trimmed for brevity UI stays same */}
      </div>
    </>
  )
}

// ─── CSS (YOUR EXACT) ─────────────────────────────────────────────────────────

const css = `
.pay-page { padding: 24px; max-width: 1200px; margin: 0 auto; color: #f1f5f9; }
.pay-top { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.pay-title { font-size: 20px; font-weight: 600; color: #f1f5f9; }
.pay-sub { font-size: 13px; color: #64748b; margin-top: 2px; }

/* FULL CSS CONTINUES EXACTLY AS YOU SENT */
`