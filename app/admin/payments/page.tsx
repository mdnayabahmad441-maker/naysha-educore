"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PaymentsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [saving, setSaving] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [lastPayment, setLastPayment] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<"collect" | "history" | "dues">("collect")

  const [fees, setFees] = useState({
    tuition: "",
    hostel: "",
    transport: "",
    misc: "",
    other: "",
  })

  const [payments, setPayments] = useState<any[]>([])

  const feeCategories = [
    { key: "tuition",   label: "School Fee",   icon: "🏫", desc: "Tuition + Dev charges" },
    { key: "hostel",    label: "Hostel Fee",    icon: "🏠", desc: "Boarding + Meals" },
    { key: "transport", label: "Transport Fee", icon: "🚌", desc: "Bus route charges" },
    { key: "misc",      label: "Misc Fee",      icon: "📋", desc: "Library, Lab, Sports" },
    { key: "other",     label: "Other Fee",     icon: "📝", desc: "Exam / Fine / Extra" },
  ]

  const total =
    Number(fees.tuition   || 0) +
    Number(fees.hostel    || 0) +
    Number(fees.transport || 0) +
    Number(fees.misc      || 0) +
    Number(fees.other     || 0)

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

  useEffect(() => {
    supabase.from("classes").select("id,name").then(({ data }) => setClasses(data || []))
  }, [])

  useEffect(() => {
    if (!selectedClass) return
    supabase
      .from("student_enrollments")
      .select("students(id,name)")
      .eq("class_id", selectedClass)
      .then(({ data }) => setStudents(data?.map((d: any) => d.students) || []))
  }, [selectedClass])

  useEffect(() => {
    if (!selectedStudent) return
    supabase
      .from("fees")
      .select("*")
      .eq("student_id", selectedStudent)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setFees({
          tuition:   data.tuition_fee   || "",
          hostel:    data.hostel_fee    || "",
          transport: data.transport_fee || "",
          misc:      data.misc_fee      || "",
          other:     data.other_fee     || "",
        })
      })
  }, [selectedStudent])

  const loadPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id,amount,date,students(name)")
      .order("date", { ascending: false })
    setPayments(data || [])
  }

  useEffect(() => { loadPayments() }, [])

  const addPayment = async () => {
    if (!selectedStudent) return alert("Please select a student")
    if (total === 0) return alert("Enter at least one fee amount")
    setSaving(true)
    const { error } = await supabase.from("payments").insert({
      student_id: selectedStudent,
      amount: total,
      date: new Date().toISOString(),
    })
    setSaving(false)
    if (error) { alert("Error saving payment"); console.error(error); return }
    setLastPayment({
      receiptNo: "RCP-" + Date.now().toString().slice(-8),
      studentName: selectedStudentName,
      className: classes.find(c => c.id === selectedClass)?.name || "",
      amount: total,
      date: new Date().toLocaleString("en-IN"),
      fees: { ...fees },
    })
    setShowReceipt(true)
    loadPayments()
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* TOP BAR */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-between shadow-sm">
        <p className="text-sm text-slate-400">
          Finance <span className="mx-1">›</span>
          <span className="text-slate-800 font-semibold">Collect Fee</span>
        </p>
        <div className="relative w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center cursor-pointer">
          🔔
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">7</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-7">

        {/* TABS */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm w-fit">
          {(["collect", "history", "dues"] as const).map(tab => {
            const label = { collect: "💳  Collect Fee", history: "🕐  Payment History", dues: "⚠️  Outstanding Dues" }[tab]
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all border-none cursor-pointer ${
                  activeTab === tab
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* ══════ COLLECT FEE ══════ */}
        {activeTab === "collect" && (
          <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 300px" }}>

            {/* LEFT */}
            <div className="space-y-5">

              {/* Student selectors */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="font-bold text-sm mb-4 flex items-center gap-2"><span>🔍</span> Select Student</p>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Class <span className="text-red-500">*</span></label>
                    <select
                      value={selectedClass}
                      onChange={e => {
                        setSelectedClass(e.target.value)
                        setSelectedStudent("")
                        setSelectedStudentName("")
                        setFees({ tuition: "", hostel: "", transport: "", misc: "", other: "" })
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">— Select Class —</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Student <span className="text-red-500">*</span></label>
                    <select
                      value={selectedStudent}
                      onChange={e => {
                        setSelectedStudent(e.target.value)
                        setSelectedStudentName(students.find(s => s.id === e.target.value)?.name || "")
                      }}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="">— Select Student —</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Selected student chip */}
                {selectedStudentName && (
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
                      {selectedStudentName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedStudentName}</p>
                      <p className="text-xs text-slate-500">{classes.find(c => c.id === selectedClass)?.name}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedStudent(""); setSelectedStudentName(""); setFees({ tuition: "", hostel: "", transport: "", misc: "", other: "" }) }}
                      className="ml-auto text-xs font-bold text-blue-600 bg-transparent border-none cursor-pointer"
                    >
                      Change ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Fee category cards */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="font-bold text-sm mb-4 flex items-center gap-2"><span>📂</span> Fee Breakdown</p>
                <div className="grid grid-cols-2 gap-3">
                  {feeCategories.map(cat => (
                    <div
                      key={cat.key}
                      className="rounded-xl border p-4 transition-all duration-200"
                      style={{
                        borderColor: (fees as any)[cat.key] ? "#2563eb" : "#e2e8f0",
                        background:  (fees as any)[cat.key] ? "#eff6ff" : "#f8fafc",
                      }}
                    >
                      <div className="text-xl mb-1">{cat.icon}</div>
                      <p className="font-bold text-sm">{cat.label}</p>
                      <p className="text-[11px] text-slate-400 mb-3">{cat.desc}</p>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                        <input
                          type="number"
                          value={(fees as any)[cat.key]}
                          onChange={e => setFees({ ...fees, [cat.key]: e.target.value })}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-bold outline-none focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT — SUMMARY */}
            <div className="sticky" style={{ top: 72, alignSelf: "start" }}>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 font-bold text-sm">💰 Payment Summary</div>

                {selectedStudentName ? (
                  <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                      {selectedStudentName[0]}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{selectedStudentName}</p>
                      <p className="text-xs text-slate-400">{classes.find(c => c.id === selectedClass)?.name}</p>
                    </div>
                  </div>
                ) : (
                  <p className="px-5 py-3.5 text-xs text-slate-400 border-b border-slate-100">No student selected</p>
                )}

                {/* Fee rows */}
                <div>
                  {feeCategories.map(cat =>
                    (fees as any)[cat.key] ? (
                      <div key={cat.key} className="flex justify-between items-center px-5 py-3 border-b border-slate-50 text-sm">
                        <span className="text-slate-500">{cat.icon} {cat.label}</span>
                        <span className="font-bold">{fmt(Number((fees as any)[cat.key]))}</span>
                      </div>
                    ) : null
                  )}
                  {total === 0 && (
                    <p className="px-5 py-4 text-xs text-slate-400 text-center">Enter fee amounts to see total</p>
                  )}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center px-5 py-4 bg-slate-50 border-t border-slate-200">
                  <span className="font-black text-sm">Total Payable</span>
                  <span className="text-2xl font-black text-blue-600">{fmt(total)}</span>
                </div>

                {/* Button */}
                <div className="px-5 pb-5 pt-4">
                  <button
                    onClick={addPayment}
                    disabled={saving || !selectedStudent || total === 0}
                    className="w-full py-3.5 rounded-xl text-white font-black text-sm border-none cursor-pointer transition-all"
                    style={{
                      background: saving || !selectedStudent || total === 0 ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#2563eb)",
                      boxShadow: saving || !selectedStudent || total === 0 ? "none" : "0 4px 14px rgba(37,99,235,.35)",
                    }}
                  >
                    {saving ? "⏳ Processing..." : `✓ Confirm & Collect ${fmt(total)}`}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 mt-2">🔒 Secure · Auto SMS to Parent</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══════ PAYMENT HISTORY ══════ */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-sm">🕐 Recent Payments</span>
              <span className="text-xs text-slate-400">{payments.length} records</span>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Student", "Amount", "Date"].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-400 text-sm">No payments recorded yet</td></tr>
                )}
                {payments.map(p => (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                          {p.students?.name?.[0] || "?"}
                        </div>
                        <span className="font-semibold text-sm">{p.students?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-black text-green-600 text-sm">{fmt(p.amount)}</td>
                    <td className="px-6 py-3.5 text-sm text-slate-400">
                      {new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ══════ OUTSTANDING DUES ══════ */}
        {activeTab === "dues" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 font-bold text-sm">⚠️ Outstanding Dues</div>
            <div className="py-16 text-center text-slate-400">
              <div className="text-4xl mb-3">📋</div>
              <p className="font-semibold text-sm">Query students with unpaid fees to show dues here</p>
            </div>
          </div>
        )}

      </div>

      {/* ══════ RECEIPT MODAL ══════ */}
      {showReceipt && lastPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5">
          <div className="bg-white rounded-2xl w-[390px] max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="rounded-t-2xl text-center p-7" style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)" }}>
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-3xl mx-auto mb-3">✅</div>
              <p className="text-white font-black text-xl">Payment Received</p>
              <p className="text-white/70 text-xs mt-1">Delhi Public School, Patna</p>
              <p className="text-white font-black text-4xl mt-4">{fmt(lastPayment.amount)}</p>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-3 text-center mb-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Receipt Number</p>
                <p className="font-black text-base mt-1 font-mono">{lastPayment.receiptNo}</p>
              </div>
              {[["Student", lastPayment.studentName], ["Class", lastPayment.className], ["Date & Time", lastPayment.date]].map(([l, v]) => (
                <div key={l} className="flex justify-between py-2.5 border-b border-slate-50 text-sm">
                  <span className="text-slate-400">{l}</span>
                  <span className="font-bold">{v}</span>
                </div>
              ))}
              {feeCategories.map(cat =>
                lastPayment.fees[cat.key] ? (
                  <div key={cat.key} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                    <span className="text-slate-400">{cat.icon} {cat.label}</span>
                    <span className="font-semibold">{fmt(Number(lastPayment.fees[cat.key]))}</span>
                  </div>
                ) : null
              )}
              <div className="flex justify-between py-3 border-t-2 border-slate-200 mt-1">
                <span className="font-black text-sm">Total Paid</span>
                <span className="font-black text-blue-600 text-xl">{fmt(lastPayment.amount)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <button onClick={() => window.print()} className="border border-slate-200 bg-white py-2.5 rounded-xl text-sm font-bold cursor-pointer hover:border-blue-400">🖨️ Print</button>
                <button className="text-white py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer" style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>📱 SMS Parent</button>
              </div>
              <button onClick={() => setShowReceipt(false)} className="w-full mt-2 py-2 text-sm text-slate-400 bg-transparent border-none cursor-pointer">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}