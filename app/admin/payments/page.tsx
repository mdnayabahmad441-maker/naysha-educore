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

interface Fee {
  id: string
  label: string
  total_amount: number
  paid_amount: number
  status: "paid" | "partial" | "due"
  fee_type?: string
  month?: string
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN")
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "badge-paid",
    partial: "badge-partial",
    due: "badge-due",
  }
  return <span className={`badge ${map[status] || "badge-due"}`}>{status}</span>
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct = Math.min(100, Math.round((paid / total) * 100))
  const color = pct === 100 ? "#639922" : pct > 50 ? "#185FA5" : "#BA7517"
  return (
    <div>
      <div className="progress-label">{pct}%</div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + "%", background: color }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)

  // Table data
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats>({ totalCollected: 0, totalPending: 0, thisMonth: 0, todayCount: 0 })
  const [loadingTable, setLoadingTable] = useState(true)

  // Search / filter
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])

  // Form fields
  const [mStudentId, setMStudentId] = useState("")
  const [mFeeId, setMFeeId] = useState("")
  const [mAmount, setMAmount] = useState("")
  const [mDate, setMDate] = useState(todayISO())
  const [mMode, setMMode] = useState("cash")
  const [mRemarks, setMRemarks] = useState("")
  const [mLoading, setMLoading] = useState(false)
  const [isManualDate, setIsManualDate] = useState(false)

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    getSchoolId().then((id) => setSchoolId(id))
  }, [])

  // ── Load payments + stats ─────────────────────────────────────────────────

  useEffect(() => {
    if (!schoolId) return
    loadPayments()
    loadStudents()
  }, [schoolId])

  const loadPayments = async () => {
    setLoadingTable(true)
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        receipt_number,
        payment_date,
        is_manual,
        payment_mode,
        students ( name ),
        fees ( label, total_amount, paid_amount, status, fee_type )
      `)
      .eq("school_id", schoolId)
      .order("payment_date", { ascending: false })
      .limit(100)

    if (error) {
      console.error(error)
      setLoadingTable(false)
      return
    }

    const rows: Payment[] = (data || []).map((p: any) => ({
      id: p.id,
      student_name: p.students?.name || "—",
      receipt_number: p.receipt_number,
      fee_label: p.fees?.label || p.fees?.fee_type || "—",
      amount: p.amount,
      total_amount: p.fees?.total_amount || 0,
      payment_date: p.payment_date,
      status: p.fees?.status || "due",
      is_manual: p.is_manual,
      payment_mode: p.payment_mode || "cash",
    }))

    setPayments(rows)
    computeStats(rows)
    setLoadingTable(false)
  }

  const computeStats = (rows: Payment[]) => {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    const todayStr = todayISO()

    const totalCollected = rows.reduce((s, r) => s + r.amount, 0)

    const todayCount = rows.filter((r) => r.payment_date?.startsWith(todayStr)).length
    const monthlyTotal = rows
      .filter((r) => {
        const d = new Date(r.payment_date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
      .reduce((s, r) => s + r.amount, 0)

    setStats({
      totalCollected,
      totalPending: 0, // filled below
      thisMonth: monthlyTotal,
      todayCount,
    })

    // separately fetch pending dues
    supabase
      .from("fees")
      .select("total_amount, paid_amount")
      .eq("school_id", schoolId)
      .neq("status", "paid")
      .then(({ data }) => {
        const pending = (data || []).reduce((s: number, f: any) => s + (f.total_amount - f.paid_amount), 0)
        setStats((prev) => ({ ...prev, totalPending: pending }))
      })
  }

  // ── Filter ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    let result = payments
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.student_name.toLowerCase().includes(q) ||
          p.receipt_number.toLowerCase().includes(q) ||
          p.fee_label.toLowerCase().includes(q)
      )
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter)
    if (monthFilter) {
      result = result.filter((p) => {
        const d = new Date(p.payment_date)
        return d.toLocaleString("en-IN", { month: "long" }) === monthFilter
      })
    }
    setFilteredPayments(result)
  }, [search, statusFilter, monthFilter, payments])

  // ─── Students (FIXED – direct query, no enrollments) ──────────────────────
  const loadStudents = async () => {
    if (!schoolId) return

    console.log("🔍 Loading students for school:", schoolId)

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class")
      .eq("school_id", schoolId)
      .order("name")

    if (error) {
      console.error("❌ Failed to load students:", error)
      setStudents([])
      return
    }

    console.log("✅ Students loaded:", data)
    setStudents(data || [])
  }

  // ── Fees for selected student ──────────────────────────────────────────────

  const loadFees = async (studentId: string) => {
    setMFeeId("")
    setMAmount("")
    setFees([])
    if (!studentId) return
    const { data } = await supabase
      .from("fees")
      .select("id, label, fee_type, total_amount, paid_amount, status")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .neq("status", "paid")
    setFees(data || [])
  }

  const handleFeeChange = (feeId: string) => {
    setMFeeId(feeId)
    const fee = fees.find((f) => f.id === feeId)
    if (fee) setMAmount(String(fee.total_amount - fee.paid_amount))
  }

  const handleDateChange = (val: string) => {
    setMDate(val)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setIsManualDate(new Date(val) < today)
  }

  // ── Save payment ───────────────────────────────────────────────────────────

  const save = async () => {
    if (!mStudentId || !mFeeId || !mAmount) {
      alert("Please fill in all required fields.")
      return
    }
    const payAmount = Number(mAmount)
    if (payAmount <= 0) {
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
      const fee = fees.find((f) => f.id === mFeeId)
      if (!fee) { alert("Fee not found."); setMLoading(false); return }

      const newPaid = (fee.paid_amount || 0) + payAmount
      const paymentId = crypto.randomUUID()

      const { error: payErr } = await supabase.from("payments").insert({
        id: paymentId,
        student_id: mStudentId,
        fee_id: mFeeId,
        amount: payAmount,
        school_id: schoolId,
        receipt_number: "RCPT-" + Date.now(),
        date: new Date().toISOString(),
        payment_date: selectedDate.toISOString(),
        is_manual: isManualDate,
        payment_mode: mMode,
        remarks: mRemarks || null,
      })

      if (payErr) { alert(payErr.message); setMLoading(false); return }

      const { error: feeErr } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.total_amount ? "paid" : "partial",
        })
        .eq("id", mFeeId)
        .eq("school_id", schoolId)

      if (feeErr) { alert(feeErr.message); setMLoading(false); return }

      // Notify
      try {
        await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "payment", refId: paymentId }),
        })
      } catch (_) {}

      // Reset + reload
      resetModal()
      setModalOpen(false)
      await loadPayments()
      alert(`Payment recorded successfully!\n\nReceipt: RCPT-${Date.now()}\nAmount: ${formatINR(payAmount)}${isManualDate ? "\n\n⚠️ Saved as manual back-dated entry." : ""}`)
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    }

    setMLoading(false)
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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <style>{css}</style>

      <div className="pay-page">

        {/* Header */}
        <div className="pay-top">
          <div>
            <h1 className="pay-title">Fee payments</h1>
            <p className="pay-sub">Manage and record student fee payments</p>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record payment
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total collected" value={formatINR(stats.totalCollected)} sub="This academic year" color="#185FA5" />
          <StatCard label="Pending dues" value={formatINR(stats.totalPending)} sub="Outstanding fees" color="#A32D2D" />
          <StatCard label="This month" value={formatINR(stats.thisMonth)} sub={new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })} color="#3B6D11" />
          <StatCard label="Payments today" value={String(stats.todayCount)} sub="Recorded entries" />
        </div>

        {/* Table card */}
        <div className="pay-card">
          <div className="card-header">
            <div className="card-title">Payment records</div>
            <div className="filter-row">
              <input
                className="search-input"
                placeholder="Search student or receipt..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="due">Due</option>
              </select>
              <select className="filter-select" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
                <option value="">All months</option>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                  <option key={m}>{m}</option>
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
                    <th>Receipt no.</th>
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
                  {filteredPayments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="student-cell">
                          <div className="avatar">{initials(p.student_name)}</div>
                          <span className="student-name">{p.student_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="receipt">{p.receipt_number}</span>
                        {p.is_manual && <span className="badge badge-manual" style={{ marginLeft: 6 }}>Manual</span>}
                      </td>
                      <td className="muted">{p.fee_label}</td>
                      <td className="bold">{formatINR(p.amount)}</td>
                      <td className="muted">{formatINR(p.total_amount)}</td>
                      <td style={{ minWidth: 100 }}>
                        <ProgressBar paid={p.amount} total={p.total_amount} />
                      </td>
                      <td className="muted nowrap">{formatDate(p.payment_date)}</td>
                      <td className="muted capitalize">{p.payment_mode}</td>
                      <td><StatusBadge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="overlay" onClick={() => { setModalOpen(false); resetModal() }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Record payment</span>
              <button className="close-btn" onClick={() => { setModalOpen(false); resetModal() }}>&#x2715;</button>
            </div>

            {isManualDate && (
              <div className="notice notice-manual">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                This will be saved as a manual back-dated entry.
              </div>
            )}

            <div className="form-row">
              <label>Student</label>
              <select
                className="form-control"
                value={mStudentId}
                onChange={(e) => { setMStudentId(e.target.value); loadFees(e.target.value) }}
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.class ? ` — ${s.class}` : ""}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <label>Fee type</label>
              <select
                className="form-control"
                value={mFeeId}
                onChange={(e) => handleFeeChange(e.target.value)}
                disabled={!mStudentId}
              >
                <option value="">Select fee</option>
                {fees.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label || f.fee_type} — {formatINR(f.total_amount - f.paid_amount)} due
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-row">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  value={mAmount}
                  onChange={(e) => setMAmount(e.target.value)}
                  placeholder="0"
                  min="1"
                />
              </div>
              <div className="form-row">
                <label>Payment date</label>
                <input
                  type="date"
                  className="form-control"
                  value={mDate}
                  max={todayISO()}
                  onChange={(e) => handleDateChange(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <label>Payment mode</label>
              <select className="form-control" value={mMode} onChange={(e) => setMMode(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank">Bank transfer</option>
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
                onChange={(e) => setMRemarks(e.target.value)}
                placeholder="e.g. Paid by parent at front desk"
              />
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setModalOpen(false); resetModal() }}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={mLoading}>
                {mLoading ? "Processing..." : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Confirm payment
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

// ─── Styles ───────────────────────────────────────────────────────────────────

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