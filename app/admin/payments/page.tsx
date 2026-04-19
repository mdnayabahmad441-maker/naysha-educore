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
  const [activeTab, setActiveTab] = useState<"collect" | "history">("collect")

  const [fees, setFees] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])

  const fmt = (n: number) => "₹" + n.toLocaleString("en-IN")

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

  // LOAD FEES (MULTIPLE ROWS)
  useEffect(() => {
    if (!selectedStudent) return

    const loadFees = async () => {
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", selectedStudent)

      const withInputs = (data || []).map(f => ({
        ...f,
        pay_now: ""
      }))

      setFees(withInputs)
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

  // TOTAL CALCULATION
  const total = fees.reduce((sum, f) => {
    return sum + Number(f.pay_now || 0)
  }, 0)

  // SAVE PAYMENTS
  const addPayment = async () => {
    if (!selectedStudent) return alert("Select student")
    if (total === 0) return alert("Enter payment amount")

    setSaving(true)

    try {
      for (let f of fees) {
        const payAmount = Number(f.pay_now || 0)
        if (payAmount <= 0) continue

        const newPaid = Number(f.paid_amount || 0) + payAmount

        // UPDATE FEES
        await supabase
          .from("fees")
          .update({
            paid_amount: newPaid,
            status: newPaid >= f.amount ? "paid" : "pending"
          })
          .eq("id", f.id)

        // INSERT PAYMENT
        await supabase.from("payments").insert({
          student_id: selectedStudent,
          fee_id: f.id,
          amount: payAmount,
          date: new Date().toISOString(),
          receipt_number: "RCP-" + Date.now()
        })
      }

      alert("Payment saved")
      setSelectedStudent("")
      setSelectedStudentName("")
      setFees([])
      loadPayments()

    } catch (err) {
      console.error(err)
      alert("Error saving payment")
    }

    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-3 font-semibold">
        Payments
      </div>

      <div className="max-w-6xl mx-auto p-6">

        {/* TABS */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("collect")}
            className={`px-4 py-2 rounded ${activeTab === "collect" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Collect Fee
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`px-4 py-2 rounded ${activeTab === "history" ? "bg-blue-600 text-white" : "bg-white border"}`}
          >
            Payment History
          </button>
        </div>

        {/* ================= COLLECT ================= */}
        {activeTab === "collect" && (
          <div className="grid gap-6 grid-cols-[1fr_300px]">

            {/* LEFT */}
            <div className="space-y-5">

              {/* SELECT */}
              <div className="bg-white p-4 border rounded">

                <div className="flex gap-3 mb-3">

                  <select
                    className="border p-2 w-full"
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value)
                      setSelectedStudent("")
                    }}
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>

                  <select
                    className="border p-2 w-full"
                    value={selectedStudent}
                    onChange={(e) => {
                      setSelectedStudent(e.target.value)
                      setSelectedStudentName(
                        students.find(s => s.id === e.target.value)?.name || ""
                      )
                    }}
                  >
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                </div>

                {selectedStudentName && (
                  <div className="text-sm">
                    Selected: <b>{selectedStudentName}</b>
                  </div>
                )}

              </div>

              {/* FEES TABLE */}
              <div className="bg-white p-4 border rounded">

                <h3 className="mb-3 font-semibold">Fee Records</h3>

                <table className="w-full text-sm border">
                  <thead>
                    <tr>
                      <th className="border p-2">Total</th>
                      <th className="border p-2">Paid</th>
                      <th className="border p-2">Pending</th>
                      <th className="border p-2">Pay Now</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f, i) => (
                      <tr key={f.id}>
                        <td className="border p-2">₹ {f.amount}</td>
                        <td className="border p-2">₹ {f.paid_amount}</td>
                        <td className="border p-2 text-red-500">
                          ₹ {f.amount - f.paid_amount}
                        </td>
                        <td className="border p-2">
                          <input
                            type="number"
                            className="w-full border p-1"
                            value={f.pay_now}
                            onChange={(e) => {
                              const updated = [...fees]
                              updated[i].pay_now = e.target.value
                              setFees(updated)
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </div>

            </div>

            {/* RIGHT */}
            <div className="bg-white p-4 border rounded h-fit">

              <h3 className="mb-3 font-semibold">Summary</h3>

              <div className="text-sm mb-2">
                Student: {selectedStudentName || "-"}
              </div>

              <div className="text-lg font-bold mb-4">
                Total: {fmt(total)}
              </div>

              <button
                onClick={addPayment}
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2"
              >
                {saving ? "Saving..." : "Save Payment"}
              </button>

            </div>

          </div>
        )}

        {/* ================= HISTORY ================= */}
        {activeTab === "history" && (
          <div className="bg-white border rounded">

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Student</th>
                  <th className="p-2 text-left">Amount</th>
                  <th className="p-2 text-left">Date</th>
                </tr>
              </thead>

              <tbody>
                {payments.map(p => (
                  <tr key={p.id} className="border-b">
                    <td className="p-2">{p.students?.name}</td>
                    <td className="p-2">₹ {p.amount}</td>
                    <td className="p-2">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

      </div>
    </div>
  )
}