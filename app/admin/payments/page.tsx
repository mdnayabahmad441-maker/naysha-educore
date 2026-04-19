"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PaymentsPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedClass, setSelectedClass] = useState("")
  const [selectedStudent, setSelectedStudent] = useState("")

  const [fees, setFees] = useState({
    tuition: "",
    hostel: "",
    transport: "",
    misc: "",
    other: ""
  })

  const [payments, setPayments] = useState<any[]>([])

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
          other: data.other_fee || ""
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
    const total =
      Number(fees.tuition || 0) +
      Number(fees.hostel || 0) +
      Number(fees.transport || 0) +
      Number(fees.misc || 0) +
      Number(fees.other || 0)

    const { error } = await supabase.from("payments").insert({
      student_id: selectedStudent,
      amount: total,
      date: new Date().toISOString()
    })

    if (error) {
      alert("Error saving payment")
      console.error(error)
      return
    }

    loadPayments()
  }

  return (
    <div className="mx-auto max-w-6xl p-6 text-white">

      <h1 className="text-xl font-semibold mb-4">Payments</h1>

      {/* FILTER CARD */}
      <div className="rounded-xl border border-white/10 bg-white/10 p-4 mb-6 flex gap-3">

        <select
          className="bg-transparent border border-white/20 p-2 rounded"
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
          className="bg-transparent border border-white/20 p-2 rounded"
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">Select Student</option>
          {students.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <button
          onClick={addPayment}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Save Payment
        </button>
      </div>

      {/* FEE GRID */}
      <div className="rounded-xl border border-white/10 bg-white/10 p-4 mb-6">

        <h2 className="mb-3">Fee Breakdown</h2>

        <table className="w-full text-sm border border-white/10">
          <thead>
            <tr>
              <th className="border p-2">Fee Type</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {[
              { key: "tuition", label: "Tuition Fee" },
              { key: "hostel", label: "Hostel Fee" },
              { key: "transport", label: "Transport Fee" },
              { key: "misc", label: "Misc Fee" },
              { key: "other", label: "Other Fee" }
            ].map((f) => (
              <tr key={f.key}>
                <td className="border p-2">{f.label}</td>
                <td className="border p-2">
                  <input
                    className="w-full bg-transparent outline-none"
                    value={(fees as any)[f.key]}
                    onChange={(e) =>
                      setFees({ ...fees, [f.key]: e.target.value })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* PAYMENTS TABLE */}
      <div className="rounded-xl border border-white/10 bg-white/10 p-4">

        <h2 className="mb-3">Recent Payments</h2>

        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="border p-2">Student</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(p => (
              <tr key={p.id}>
                <td className="border p-2">{p.students?.name}</td>
                <td className="border p-2">₹ {p.amount}</td>
                <td className="border p-2">
                  {new Date(p.date).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

    </div>
  )
}