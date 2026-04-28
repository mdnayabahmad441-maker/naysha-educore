"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

type PaymentRow = {
  id: string
  amount: number
  date: string
  receipt_number: string | null
  student_id: string
  studentName: string
  className: string
}

type ClassOption = { id: string; name: string }

const PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Custom", value: "custom" },
]

function getDateRange(preset: string, customFrom: string, customTo: string): [string, string] {
  const now = new Date()
  const pad = (d: Date) => d.toISOString().split("T")[0]
  if (preset === "today") { const d = pad(now); return [d, d] }
  if (preset === "yesterday") { const y = new Date(now); y.setDate(y.getDate() - 1); const d = pad(y); return [d, d] }
  if (preset === "week") { const s = new Date(now); s.setDate(now.getDate() - now.getDay()); return [pad(s), pad(now)] }
  if (preset === "month") { return [pad(new Date(now.getFullYear(), now.getMonth(), 1)), pad(now)] }
  return [customFrom, customTo]
}

export default function ReportsPage() {
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [preset, setPreset] = useState("today")
  const [customFrom, setCustomFrom] = useState(() => new Date().toISOString().split("T")[0])
  const [customTo, setCustomTo] = useState(() => new Date().toISOString().split("T")[0])
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSchoolId().then(async (sid) => {
      if (!sid) return
      setSchoolId(sid)
      const { data } = await supabase.from("classes").select("id,name").eq("school_id", sid).order("name")
      setClasses(data || [])
    })
  }, [])

  const load = useCallback(async () => {
    if (!schoolId) return
    setLoading(true)

    const [from, to] = getDateRange(preset, customFrom, customTo)

    // Step 1: if class filter, get student IDs in that class
    let classStudentIds: string[] | null = null
    if (selectedClass) {
      const year = await getActiveAcademicYear()
      let q = supabase
        .from("student_enrollments")
        .select("student_id")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)
      if (year?.id) q = q.eq("academic_year_id", year.id)
      const { data: enr } = await q
      classStudentIds = (enr || []).map((e: any) => e.student_id)
      if (classStudentIds.length === 0) {
        setPayments([])
        setLoading(false)
        return
      }
    }

    // Step 2: fetch payments for this school + date range
    let query = supabase
      .from("payments")
      .select("id,amount,date,receipt_number,student_id")
      .eq("school_id", schoolId)
      .gte("date", `${from}T00:00:00`)
      .lte("date", `${to}T23:59:59`)
      .order("date", { ascending: false })
    if (classStudentIds) query = query.in("student_id", classStudentIds)

    const { data: raw } = await query
    if (!raw?.length) {
      setPayments([])
      setLoading(false)
      return
    }

    // Step 3: student names
    const sids = [...new Set(raw.map((p: any) => p.student_id))]
    const { data: studs } = await supabase.from("students").select("id,name").in("id", sids)
    const studentMap: Record<string, string> = {}
    ;(studs || []).forEach((s: any) => { studentMap[s.id] = s.name })

    // Step 4: class names via enrollments
    const year = await getActiveAcademicYear()
    let enrQ = supabase
      .from("student_enrollments")
      .select("student_id,class_id")
      .eq("school_id", schoolId)
      .in("student_id", sids)
    if (year?.id) enrQ = enrQ.eq("academic_year_id", year.id)
    const { data: enrs } = await enrQ

    const classNameMap: Record<string, string> = {}
    classes.forEach((c) => { classNameMap[c.id] = c.name })
    const enrollMap: Record<string, string> = {}
    ;(enrs || []).forEach((e: any) => { enrollMap[e.student_id] = classNameMap[e.class_id] || "—" })

    setPayments(
      raw.map((p: any) => ({
        id: p.id,
        amount: Number(p.amount || 0),
        date: p.date,
        receipt_number: p.receipt_number || null,
        student_id: p.student_id,
        studentName: studentMap[p.student_id] || "Unknown",
        className: enrollMap[p.student_id] || "—",
      }))
    )
    setLoading(false)
  }, [schoolId, preset, customFrom, customTo, selectedClass, classes])

  useEffect(() => {
    if (schoolId) void load()
  }, [load, schoolId])

  const total = payments.reduce((s, p) => s + p.amount, 0)

  function exportCSV() {
    const [from, to] = getDateRange(preset, customFrom, customTo)
    const header = "Receipt No,Student,Class,Amount (Rs),Date\n"
    const rows = payments
      .map((p) =>
        [
          p.receipt_number || "-",
          `"${p.studentName}"`,
          `"${p.className}"`,
          p.amount,
          new Date(p.date).toLocaleString("en-IN"),
        ].join(",")
      )
      .join("\n")
    const blob = new Blob([header + rows + `\n\nTotal,,,${total},`], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `fee-collection-${from}-to-${to}.csv`
    a.click()
  }

  const fmt = (d: string) =>
    new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 text-white md:p-10">

      <div>
        <h1 className="text-3xl font-bold">Fee Collection Report</h1>
        <p className="mt-1 text-sm text-slate-400">
          Daily and date-range collection, filterable by class.
        </p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/10 bg-white/4 p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPreset(p.value)}
              className={`rounded-xl px-4 py-1.5 text-sm font-medium transition ${
                preset === p.value
                  ? "bg-blue-600 text-white"
                  : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex flex-wrap gap-4 items-center text-sm text-slate-400">
            <label className="flex items-center gap-2">
              From
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-1.5 text-white"
              />
            </label>
            <label className="flex items-center gap-2">
              To
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-1.5 text-white"
              />
            </label>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm text-slate-400">
          Class:
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="rounded-xl border border-white/10 bg-[#0b1220] px-3 py-1.5 text-white"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-xs text-slate-400 mb-1">Total Collected</p>
          <p className="text-2xl font-bold text-emerald-300">
            ₹{total.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-5">
          <p className="text-xs text-slate-400 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-blue-300">{payments.length}</p>
        </div>
        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5">
          <p className="text-xs text-slate-400 mb-1">Avg per Transaction</p>
          <p className="text-2xl font-bold text-purple-300">
            ₹{payments.length ? Math.round(total / payments.length).toLocaleString("en-IN") : 0}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Transactions</h2>
          {payments.length > 0 && (
            <button
              type="button"
              onClick={exportCSV}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-slate-300 hover:bg-white/10 transition"
            >
              Export CSV
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 p-8 text-slate-400 text-sm">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
            Loading...
          </div>
        ) : payments.length === 0 ? (
          <p className="p-8 text-center text-slate-500 text-sm">
            No payments found for this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Receipt</th>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Class</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-left">Date &amp; Time</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2">
                    <td className="px-5 py-3 font-mono text-xs text-slate-400">
                      {p.receipt_number || "—"}
                    </td>
                    <td className="px-5 py-3 font-medium text-white">{p.studentName}</td>
                    <td className="px-5 py-3 text-slate-300">{p.className}</td>
                    <td className="px-5 py-3 text-right font-semibold text-emerald-300">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{fmt(p.date)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/2">
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-300">
                    Total
                  </td>
                  <td className="px-5 py-3 text-right text-base font-bold text-emerald-300">
                    ₹{total.toLocaleString("en-IN")}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
