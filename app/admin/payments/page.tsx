"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PaymentsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [selectedGateway, setSelectedGateway] = useState("UPI / QR")
  const [remark, setRemark] = useState("")
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
    { key: "tuition", label: "School Fee", icon: "🏫", desc: "Tuition + Dev charges" },
    { key: "hostel", label: "Hostel Fee", icon: "🏠", desc: "Boarding + Meals" },
    { key: "transport", label: "Transport Fee", icon: "🚌", desc: "Bus route charges" },
    { key: "misc", label: "Misc Fee", icon: "📋", desc: "Library, Lab, Sports" },
    { key: "other", label: "Other Fee", icon: "📝", desc: "Exam / Fine / Extra" },
  ]

  const gateways = [
    { name: "UPI / QR", icon: "📱", desc: "PhonePe, GPay, Paytm", bg: "#e0f2fe" },
    { name: "Card", icon: "💳", desc: "Credit / Debit card", bg: "#fce7f3" },
    { name: "Cash", icon: "💵", desc: "Counter payment", bg: "#d1fae5" },
    { name: "NEFT / RTGS", icon: "🏦", desc: "Bank transfer", bg: "#ede9fe" },
    { name: "Razorpay", icon: "⚡", desc: "Online payment link", bg: "#fef3c7" },
    { name: "Cheque / DD", icon: "📄", desc: "Enter cheque number", bg: "#fff7ed" },
  ]

  const total =
    Number(fees.tuition || 0) +
    Number(fees.hostel || 0) +
    Number(fees.transport || 0) +
    Number(fees.misc || 0) +
    Number(fees.other || 0)

  const formatINR = (n: number) =>
    "₹" + n.toLocaleString("en-IN")

  // LOAD CLASSES
  useEffect(() => {
    supabase.from("classes").select("id,name").then(({ data }) => {
      setClasses(data || [])
    })
  }, [])

  // LOAD STUDENTS
  useEffect(() => {
    if (!selectedClass) return
    supabase
      .from("student_enrollments")
      .select("students(id,name)")
      .eq("class_id", selectedClass)
      .then(({ data }) => {
        setStudents(data?.map((d: any) => d.students) || [])
      })
  }, [selectedClass])

  // AUTO FILL FEES
  useEffect(() => {
    if (!selectedStudent) return
    const loadFees = async () => {
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", selectedStudent)
        .maybeSingle()
      if (data) {
        setFees({
          tuition: data.tuition_fee || "",
          hostel: data.hostel_fee || "",
          transport: data.transport_fee || "",
          misc: data.misc_fee || "",
          other: data.other_fee || "",
        })
      }
    }
    loadFees()
  }, [selectedStudent])

  // LOAD PAYMENTS
  const loadPayments = async () => {
    const { data } = await supabase
      .from("payments")
      .select("id,amount,date,students(name)")
      .order("date", { ascending: false })
    setPayments(data || [])
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // SAVE PAYMENT
  const addPayment = async () => {
    if (!selectedStudent) return alert("Please select a student")
    if (total === 0) return alert("Enter at least one fee amount")
    setSaving(true)

    const { data, error } = await supabase
      .from("payments")
      .insert({
        student_id: selectedStudent,
        amount: total,
        date: new Date().toISOString(),
      })
      .select()
      .single()

    setSaving(false)

    if (error) {
      alert("Error saving payment")
      console.error(error)
      return
    }

    const receiptNo = "RCP-" + Date.now().toString().slice(-8)
    setLastPayment({
      receiptNo,
      studentName: selectedStudentName,
      amount: total,
      gateway: selectedGateway,
      date: new Date().toLocaleString("en-IN"),
      fees,
    })
    setShowReceipt(true)
    loadPayments()
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14 }}>

      {/* ── SIDEBAR ── */}
      <nav style={{ width: 230, background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh", overflowY: "auto" }}>
        <div style={{ padding: "22px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#2563eb,#7c3aed)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>N</div>
            <div>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>NaySha</div>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>EduCore ERP</div>
            </div>
          </div>
        </div>

        <div style={{ margin: "12px 14px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "9px 12px" }}>
          <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>Active School</div>
          <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 600, marginTop: 2 }}>Delhi Public School, Patna</div>
        </div>

        <div style={{ padding: "14px 10px", flex: 1 }}>
          {[
            { label: "Overview", items: [{ icon: "🏠", name: "Dashboard" }, { icon: "📊", name: "Analytics" }] },
            { label: "Students", items: [{ icon: "🎓", name: "All Students" }, { icon: "➕", name: "Admissions" }] },
            { label: "Academics", items: [{ icon: "👨‍🏫", name: "Teachers" }, { icon: "📅", name: "Attendance" }, { icon: "📝", name: "Exams" }, { icon: "🏆", name: "Results" }] },
            { label: "Finance", items: [{ icon: "💳", name: "Collect Fee", active: true }, { icon: "📋", name: "Fee Register" }, { icon: "📈", name: "Reports" }] },
          ].map((group) => (
            <div key={group.label}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "#475569", padding: "10px 10px 6px" }}>{group.label}</div>
              {group.items.map((item: any) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 10px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: item.active ? "#93c5fd" : "#94a3b8", cursor: "pointer", marginBottom: 1, background: item.active ? "linear-gradient(135deg,rgba(37,99,235,.22),rgba(124,58,237,.12))" : "transparent", borderLeft: item.active ? "2px solid #2563eb" : "2px solid transparent" }}>
                  <span style={{ fontSize: 15, width: 20 }}>{item.icon}</span>
                  {item.name}
                  {item.active && <span style={{ marginLeft: "auto", background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 20 }}>7</span>}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>N</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>Nayab Ahmed</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Super Admin</div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* TOPBAR */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 28px", height: 56, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,.05)", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Finance <span style={{ color: "#cbd5e1", margin: "0 4px" }}>›</span>
              <span style={{ color: "#0f172a", fontWeight: 600 }}>Collect Fee</span>
            </div>
          </div>
          <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, background: "#f0f4f8", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 15 }}>
            🔔
            <span style={{ position: "absolute", top: -4, right: -4, background: "#dc2626", color: "#fff", fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>7</span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* TABS */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 6, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
            {(["collect", "history", "dues"] as const).map((tab) => {
              const labels: any = { collect: "💳 Collect Fee", history: "🕐 Payment History", dues: "⚠️ Outstanding Dues" }
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", border: "none", background: activeTab === tab ? "#2563eb" : "transparent", color: activeTab === tab ? "#fff" : "#64748b", boxShadow: activeTab === tab ? "0 2px 8px rgba(37,99,235,.25)" : "none", transition: "all .2s", fontFamily: "inherit" }}>
                  {labels[tab]}
                </button>
              )
            })}
          </div>

          {/* ── COLLECT FEE TAB ── */}
          {activeTab === "collect" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

              {/* LEFT */}
              <div>

                {/* STUDENT SELECT */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>🔍</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Select Student</span>
                  </div>
                  <div style={{ padding: "20px 22px", display: "flex", gap: 14 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 6 }}>Class <span style={{ color: "#dc2626" }}>*</span></label>
                      <select
                        value={selectedClass}
                        onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudent(""); setSelectedStudentName(""); }}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", background: "#f8fafc", color: "#0f172a", outline: "none", cursor: "pointer" }}
                      >
                        <option value="">— Select Class —</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", display: "block", marginBottom: 6 }}>Student <span style={{ color: "#dc2626" }}>*</span></label>
                      <select
                        value={selectedStudent}
                        onChange={(e) => {
                          setSelectedStudent(e.target.value)
                          const s = students.find((s) => s.id === e.target.value)
                          setSelectedStudentName(s?.name || "")
                        }}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13.5, fontFamily: "inherit", background: "#f8fafc", color: "#0f172a", outline: "none", cursor: "pointer" }}
                      >
                        <option value="">— Select Student —</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Student Found Card */}
                  {selectedStudentName && (
                    <div style={{ margin: "0 22px 20px", background: "#eff6ff", border: "1.5px solid #bfdbfe", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 800, flexShrink: 0 }}>
                        {selectedStudentName[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{selectedStudentName}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                          <span style={{ marginRight: 10 }}>📚 {classes.find(c => c.id === selectedClass)?.name}</span>
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 12, color: "#2563eb", fontWeight: 700, cursor: "pointer" }} onClick={() => { setSelectedStudent(""); setSelectedStudentName(""); }}>Change ✕</div>
                    </div>
                  )}
                </div>

                {/* FEE CATEGORIES */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", marginBottom: 20, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>📂</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Fee Breakdown</span>
                  </div>
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                      {feeCategories.map((cat) => (
                        <div key={cat.key} style={{ border: `1.5px solid ${(fees as any)[cat.key] ? "#2563eb" : "#e2e8f0"}`, borderRadius: 12, padding: "14px 16px", background: (fees as any)[cat.key] ? "#eff6ff" : "#fff", transition: "all .2s" }}>
                          <div style={{ fontSize: 22, marginBottom: 6 }}>{cat.icon}</div>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{cat.label}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, marginBottom: 10 }}>{cat.desc}</div>
                          <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#64748b", fontSize: 14 }}>₹</span>
                            <input
                              type="number"
                              value={(fees as any)[cat.key]}
                              onChange={(e) => setFees({ ...fees, [cat.key]: e.target.value })}
                              placeholder="0"
                              style={{ width: "100%", padding: "9px 10px 9px 24px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 15, fontWeight: 700, fontFamily: "inherit", background: "#f8fafc", color: "#0f172a", outline: "none" }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Remark */}
                    <div style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 6 }}>Remarks</label>
                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Optional note (e.g. 'Paid by father at counter', 'Online UPI by mother')..."
                        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 10, fontSize: 13, fontFamily: "inherit", background: "#f8fafc", color: "#0f172a", outline: "none", resize: "none", height: 72 }}
                      />
                    </div>
                  </div>
                </div>

                {/* PAYMENT GATEWAY */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>💳</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>Payment Method</span>
                  </div>
                  <div style={{ padding: "20px 22px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {gateways.map((gw) => (
                        <div key={gw.name} onClick={() => setSelectedGateway(gw.name)} style={{ border: `1.5px solid ${selectedGateway === gw.name ? "#2563eb" : "#e2e8f0"}`, borderRadius: 12, padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selectedGateway === gw.name ? "#eff6ff" : "#fff", transition: "all .2s" }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: gw.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{gw.icon}</div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{gw.name}</div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>{gw.desc}</div>
                          </div>
                          <div style={{ marginLeft: "auto", width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedGateway === gw.name ? "#2563eb" : "#e2e8f0"}`, background: selectedGateway === gw.name ? "#2563eb" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {selectedGateway === gw.name && <div style={{ width: 8, height: 8, background: "#fff", borderRadius: "50%" }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT SUMMARY */}
              <div style={{ position: "sticky", top: 80, alignSelf: "start" }}>
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
                  <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0" }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>💰 Payment Summary</span>
                  </div>

                  {selectedStudentName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid #e2e8f0" }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{selectedStudentName[0]}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedStudentName}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>{classes.find(c => c.id === selectedClass)?.name}</div>
                      </div>
                    </div>
                  )}

                  <div>
                    {feeCategories.map((cat) => (fees as any)[cat.key] ? (
                      <div key={cat.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 18px", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}><span>{cat.icon}</span>{cat.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{formatINR(Number((fees as any)[cat.key]))}</span>
                      </div>
                    ) : null)}
                  </div>

                  <div style={{ height: 1, background: "#e2e8f0", margin: "0 18px" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", background: "#f8fafc" }}>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>Total Payable</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: "#2563eb" }}>{formatINR(total)}</span>
                  </div>

                  <div style={{ padding: "16px 18px" }}>
                    <button
                      onClick={addPayment}
                      disabled={saving || !selectedStudent || total === 0}
                      style={{ width: "100%", padding: "14px", background: saving || !selectedStudent || total === 0 ? "#94a3b8" : "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 800, cursor: saving || !selectedStudent || total === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", boxShadow: "0 4px 14px rgba(37,99,235,.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      {saving ? "⏳ Processing..." : `✓ Confirm & Collect ${formatINR(total)}`}
                    </button>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 11, color: "#64748b", marginTop: 10 }}>
                      🔒 Secure · Auto SMS to Parent
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === "history" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>🕐 Recent Payments</span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{payments.length} records</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Student", "Amount", "Date"].map((h) => (
                      <th key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".09em", color: "#64748b", padding: "12px 22px", textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 && (
                    <tr><td colSpan={3} style={{ padding: "32px", textAlign: "center", color: "#64748b" }}>No payments yet</td></tr>
                  )}
                  {payments.map((p) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "13px 22px", fontSize: 13, fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#2563eb,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {p.students?.name?.[0] || "?"}
                          </div>
                          {p.students?.name || "Unknown"}
                        </div>
                      </td>
                      <td style={{ padding: "13px 22px", fontSize: 14, fontWeight: 800, color: "#059669" }}>{formatINR(p.amount)}</td>
                      <td style={{ padding: "13px 22px", fontSize: 13, color: "#64748b" }}>{new Date(p.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DUES TAB ── */}
          {activeTab === "dues" && (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>⚠️ Outstanding Fee Dues</span>
              </div>
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Connect your fees table to show dues</div>
                <div style={{ fontSize: 13, marginTop: 6 }}>Query students with unpaid fee records</div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── RECEIPT MODAL ── */}
      {showReceipt && lastPayment && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: 420, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ background: "linear-gradient(135deg,#1d4ed8,#7c3aed)", padding: "28px 28px 24px", textAlign: "center", borderRadius: "20px 20px 0 0" }}>
              <div style={{ width: 56, height: 56, background: "rgba(255,255,255,.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 26 }}>✅</div>
              <div style={{ fontWeight: 800, color: "#fff", fontSize: 22 }}>Payment Received</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginTop: 4 }}>Delhi Public School, Patna</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: "#fff", marginTop: 14 }}>{formatINR(lastPayment.amount)}</div>
            </div>
            <div style={{ padding: "24px 28px" }}>
              <div style={{ background: "#f8fafc", border: "1px dashed #e2e8f0", borderRadius: 10, padding: "12px 16px", marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Receipt Number</div>
                <div style={{ fontSize: 17, fontWeight: 900, marginTop: 4, fontFamily: "monospace", letterSpacing: ".05em" }}>{lastPayment.receiptNo}</div>
              </div>
              {[
                ["Student", lastPayment.studentName],
                ["Payment Mode", lastPayment.gateway],
                ["Date & Time", lastPayment.date],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0", borderTop: "2px solid #e2e8f0", marginTop: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800 }}>Total Paid</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: "#2563eb" }}>{formatINR(lastPayment.amount)}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 20 }}>
                <button onClick={() => window.print()} style={{ border: "1.5px solid #e2e8f0", background: "#fff", padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>🖨️ Print</button>
                <button style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", border: "none", padding: 11, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>📱 SMS Parent</button>
              </div>
              <button onClick={() => setShowReceipt(false)} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#64748b", fontSize: 13, cursor: "pointer", fontFamily: "inherit", padding: 8 }}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}