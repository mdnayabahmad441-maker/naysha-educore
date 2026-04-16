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

// ─── Hardcoded fee categories ─────────────────────────────────────────────────

const FEE_CATEGORIES = [
  { key: "hostel",    label: "Hostel fee",    icon: "🏠", color: "#7c3aed" },
  { key: "school",    label: "School fee",    icon: "🏫", color: "#0369a1" },
  { key: "transport", label: "Transport fee", icon: "🚌", color: "#b45309" },
  { key: "misc",      label: "Misc fee",      icon: "📦", color: "#065f46" },
  { key: "others",    label: "Others",        icon: "💬", color: "#9f1239" },
]

type FeeAmounts = Record<string, string>

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}
function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN")
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}
function todayISO() {
  return new Date().toISOString().split("T")[0]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: color || "#f1f5f9" }}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = { paid: "badge-paid", partial: "badge-partial", due: "badge-due" }
  return <span className={`badge ${map[status] || "badge-due"}`}>{status}</span>
}

function ProgressBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 100
  const color = pct === 100 ? "#22c55e" : pct > 50 ? "#38bdf8" : "#f97316"
  return (
    <div>
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{pct}%</div>
      <div style={{ width: "100%", background: "#0f172a", borderRadius: 20, height: 4 }}>
        <div style={{ width: pct + "%", height: 4, borderRadius: 20, background: color, transition: "width .3s" }} />
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)

  // Table
  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats>({ totalCollected: 0, totalPending: 0, thisMonth: 0, todayCount: 0 })
  const [loadingTable, setLoadingTable] = useState(true)

  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [mStudentId, setMStudentId] = useState("")
  const [mDate, setMDate] = useState(todayISO())
  const [mMode, setMMode] = useState("cash")
  const [mRemarks, setMRemarks] = useState("")
  const [mLoading, setMLoading] = useState(false)
  const [isManualDate, setIsManualDate] = useState(false)
  const [feeAmounts, setFeeAmounts] = useState<FeeAmounts>({})

  // ── Init ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    getSchoolId().then((id) => setSchoolId(id))
  }, [])

  useEffect(() => {
    if (!schoolId) return
    loadPayments()
    loadStudents()
  }, [schoolId])

  // ── Load payments ─────────────────────────────────────────────────────────

  const loadPayments = async () => {
    setLoadingTable(true)
    const { data, error } = await supabase
      .from("payments")
      .select(`id, amount, receipt_number, payment_date, is_manual, payment_mode, fee_type, students(name), fees(label, total_amount, paid_amount, status, fee_type)`)
      .eq("school_id", schoolId)
      .order("payment_date", { ascending: false })
      .limit(100)

    if (error) { console.error(error); setLoadingTable(false); return }

    const rows: Payment[] = (data || []).map((p: any) => ({
      id: p.id,
      student_name: p.students?.name || "—",
      receipt_number: p.receipt_number,
      fee_label: p.fees?.fee_type || p.fee_type || p.fees?.label || "—",
      amount: p.amount,
      total_amount: p.fees?.total_amount || p.amount,
      payment_date: p.payment_date,
      status: p.fees?.status || "paid",
      is_manual: p.is_manual,
      payment_mode: p.payment_mode || "cash",
    }))

    setPayments(rows)
    computeStats(rows)
    setLoadingTable(false)
  }

  const computeStats = (rows: Payment[]) => {
    const now = new Date()
    const todayStr = todayISO()
    const totalCollected = rows.reduce((s, r) => s + r.amount, 0)
    const todayCount = rows.filter((r) => r.payment_date?.startsWith(todayStr)).length
    const monthlyTotal = rows
      .filter((r) => {
        const d = new Date(r.payment_date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((s, r) => s + r.amount, 0)

    setStats({ totalCollected, totalPending: 0, thisMonth: monthlyTotal, todayCount })

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

 const loadStudents = async () => {

  console.log("🔍 Loading students...")

  // STEP 1: get all students (SAFE QUERY)
  const { data: studentsData, error } = await supabase
    .from("students")
    .select("id, name, class")

  if (error) {
    console.error("❌ Students fetch error:", error)
    return
  }

  console.log("✅ Students fetched:", studentsData)

  // STEP 2: OPTIONAL filter by school if column exists
  const filtered = (studentsData || []).filter((s: any) => {
    if (!schoolId) return true
    if ("school_id" in s) return s.school_id === schoolId
    return true // fallback if column doesn't exist
  })

  setStudents(filtered)
}
  // ── Filters ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let result = payments
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) => p.student_name.toLowerCase().includes(q) || p.receipt_number.toLowerCase().includes(q) || p.fee_label.toLowerCase().includes(q)
      )
    }
    if (statusFilter) result = result.filter((p) => p.status === statusFilter)
    if (monthFilter) {
      result = result.filter((p) => {
        const d = new Date(p.payment_date)
        return d.toLocaleString("en-IN", { month: "long" }) === monthFilter
      })
    }
    setFiltered(result)
  }, [search, statusFilter, monthFilter, payments])

  // ── Modal helpers ─────────────────────────────────────────────────────────

  const openModal = () => {
    setFeeAmounts({})
    setMStudentId("")
    setMDate(todayISO())
    setMMode("cash")
    setMRemarks("")
    setIsManualDate(false)
    setModalOpen(true)
  }

  const handleDateChange = (val: string) => {
    setMDate(val)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    setIsManualDate(new Date(val) < today)
  }

  const totalEntered = Object.values(feeAmounts).reduce((s, v) => s + (Number(v) || 0), 0)

  // ── Save ──────────────────────────────────────────────────────────────────

  const save = async () => {
    if (!mStudentId) { alert("Please select a student."); return }
    if (totalEntered <= 0) { alert("Enter at least one fee amount."); return }

    const selectedDate = mDate ? new Date(mDate) : new Date()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (selectedDate > today) { alert("Future payments are not allowed."); return }

    setMLoading(true)

    try {
      const inserts = FEE_CATEGORIES
        .filter((cat) => Number(feeAmounts[cat.key]) > 0)
        .map((cat) => ({
          id: crypto.randomUUID(),
          student_id: mStudentId,
          fee_type: cat.key,
          amount: Number(feeAmounts[cat.key]),
          school_id: schoolId,
          receipt_number: "RCPT-" + Date.now() + "-" + cat.key.toUpperCase(),
          date: new Date().toISOString(),
          payment_date: selectedDate.toISOString(),
          is_manual: isManualDate,
          payment_mode: mMode,
          remarks: mRemarks || null,
        }))

      const { error } = await supabase.from("payments").insert(inserts)
      if (error) { alert(error.message); setMLoading(false); return }

      for (const ins of inserts) {
        try {
          await fetch("/api/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "payment", refId: ins.id }),
          })
        } catch (_) {}
      }

      setModalOpen(false)
      await loadPayments()
      alert(
        `Payment recorded successfully!\n\nTotal: ${formatINR(totalEntered)}\nEntries: ${inserts.length} fee type(s)` +
        (isManualDate ? "\n\n⚠️ Saved as manual back-dated entry." : "")
      )
    } catch (err) {
      console.error(err)
      alert("Something went wrong. Please try again.")
    }

    setMLoading(false)
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
          <button className="btn-primary" onClick={openModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Record payment
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total collected" value={formatINR(stats.totalCollected)} sub="This academic year"   color="#38bdf8" />
          <StatCard label="Pending dues"    value={formatINR(stats.totalPending)}   sub="Outstanding fees"     color="#f87171" />
          <StatCard label="This month"      value={formatINR(stats.thisMonth)}      sub={new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })} color="#4ade80" />
          <StatCard label="Payments today"  value={String(stats.todayCount)}        sub="Recorded entries" />
        </div>

        {/* Table */}
        <div className="pay-card">
          <div className="card-header">
            <div className="card-title">Payment records</div>
            <div className="filter-row">
              <input className="search-input" placeholder="Search student or receipt..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
            ) : filtered.length === 0 ? (
              <div className="table-empty">No payment records found.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Receipt no.</th>
                    <th>Fee type</th>
                    <th>Amount</th>
                    <th>Progress</th>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
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
                      <td className="muted capitalize">{p.fee_label.replace(/_/g, " ")}</td>
                      <td className="bold">{formatINR(p.amount)}</td>
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

      {/* ── Modal ── */}
      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <span className="modal-title">Record payment</span>
              <button className="close-btn" onClick={() => setModalOpen(false)}>&#x2715;</button>
            </div>

            {isManualDate && (
              <div className="notice notice-manual">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                This will be saved as a manual back-dated entry.
              </div>
            )}

            {/* Student */}
            <div className="form-row">
              <label>Student</label>
              <select className="form-control" value={mStudentId} onChange={(e) => setMStudentId(e.target.value)}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}{s.class ? ` — ${s.class}` : ""}</option>
                ))}
              </select>
            </div>

            {/* Fee grid */}
            <div className="form-row">
              <label>Fee amounts — fill what applies</label>
              <div className="fee-grid">
                {FEE_CATEGORIES.map((cat) => {
                  const active = Number(feeAmounts[cat.key]) > 0
                  return (
                    <div
                      key={cat.key}
                      className="fee-card"
                      style={{
                        borderColor: active ? cat.color : undefined,
                        background: active ? cat.color + "18" : undefined,
                      }}
                    >
                      <div className="fee-card-top">
                        <span className="fee-icon">{cat.icon}</span>
                        <span className="fee-cat-label">{cat.label}</span>
                      </div>
                      <div className="fee-input-wrap">
                        <span className="fee-rupee">₹</span>
                        <input
                          type="number"
                          className="fee-input"
                          placeholder="0"
                          min="0"
                          value={feeAmounts[cat.key] || ""}
                          onChange={(e) =>
                            setFeeAmounts((prev) => ({ ...prev, [cat.key]: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Running total */}
            {totalEntered > 0 && (
              <div className="total-row">
                <span>Total amount</span>
                <span className="total-value">{formatINR(totalEntered)}</span>
              </div>
            )}

            {/* Date + Mode */}
            <div className="form-grid">
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
            </div>

            {/* Remarks */}
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
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={mLoading}>
                {mLoading ? "Processing..." : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
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
td { padding: 12px 12px; border-bottom: 1px solid #1a2535; color: #cbd5e1; }
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
.badge-paid    { background: #14532d; color: #86efac; }
.badge-partial { background: #431407; color: #fdba74; }
.badge-due     { background: #450a0a; color: #fca5a5; }
.badge-manual  { background: #0c2a4a; color: #7dd3fc; }

.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.65); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #1e293b; border: 1px solid #334155; border-radius: 14px; width: 520px; max-width: calc(100vw - 32px); padding: 24px; max-height: 90vh; overflow-y: auto; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.modal-title { font-size: 16px; font-weight: 600; color: #f1f5f9; }
.close-btn { background: none; border: none; cursor: pointer; font-size: 18px; color: #64748b; padding: 2px 6px; border-radius: 4px; }
.close-btn:hover { background: #334155; color: #f1f5f9; }

.notice { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 12px; margin-bottom: 16px; }
.notice-manual { background: #431407; color: #fdba74; }

.form-row { margin-bottom: 16px; }
.form-row label { display: block; font-size: 11px; font-weight: 600; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: .4px; }
.form-control { width: 100%; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 9px 12px; font-size: 14px; color: #f1f5f9; }
.form-control:focus { outline: none; border-color: #185FA5; box-shadow: 0 0 0 3px rgba(24,95,165,.2); }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.fee-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; }
.fee-card { background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 14px 12px; transition: border-color .15s, background .15s; }
.fee-card-top { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
.fee-icon { font-size: 16px; line-height: 1; }
.fee-cat-label { font-size: 12px; font-weight: 500; color: #94a3b8; }
.fee-input-wrap { display: flex; align-items: center; background: #1e293b; border: 1px solid #334155; border-radius: 6px; overflow: hidden; }
.fee-rupee { padding: 0 8px; font-size: 13px; color: #64748b; font-weight: 500; border-right: 1px solid #334155; }
.fee-input { flex: 1; background: transparent; border: none; outline: none; padding: 7px 8px; font-size: 14px; font-weight: 600; color: #f1f5f9; width: 0; min-width: 0; }
.fee-input::placeholder { color: #334155; font-weight: 400; }

.total-row { display: flex; justify-content: space-between; align-items: center; background: #0f172a; border: 1px solid #1d4ed8; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 13px; color: #94a3b8; }
.total-value { font-size: 16px; font-weight: 700; color: #4ade80; }

.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; padding-top: 16px; border-top: 1px solid #334155; }
`