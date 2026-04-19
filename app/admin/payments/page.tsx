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

  // LOAD EXISTING FEES (AUTO FILL)
  useEffect(() => {
    if (!selectedStudent) return

    const loadFees = async () => {
      const { data } = await supabase
        .from("fees") // ⚠️ adjust if needed
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

    setPayments(data || [])
  }

  useEffect(() => {
    loadPayments()
  }, [])

  // ADD PAYMENT
  const addPayment = async () => {
    const total =
      Number(fees.tuition || 0) +
      Number(fees.hostel || 0) +
      Number(fees.transport || 0) +
      Number(fees.misc || 0) +
      Number(fees.other || 0)

    await supabase.from("payments").insert({
      student_id: selectedStudent,
      amount: total,
      breakdown: fees, // JSON column recommended
      date: new Date().toISOString()
    })

    alert("Payment Added")
    loadPayments()
  }

  return (
    <div className="p-6 bg-white min-h-screen text-black">

      <h1 className="text-xl font-semibold mb-4">Payments</h1>

      {/* SELECTORS */}
      <div className="flex gap-3 mb-4">
        <select onChange={(e) => setSelectedClass(e.target.value)} className="border p-2">
          <option>Select Class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select onChange={(e) => setSelectedStudent(e.target.value)} className="border p-2">
          <option>Select Student</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* FEE GRID */}
      <table className="border mb-4">
        <tbody>
          <tr>
            <td className="border p-2">Tuition Fee</td>
            <td><input value={fees.tuition} onChange={e => setFees({...fees, tuition: e.target.value})} /></td>
          </tr>
          <tr>
            <td className="border p-2">Hostel Fee</td>
            <td><input value={fees.hostel} onChange={e => setFees({...fees, hostel: e.target.value})} /></td>
          </tr>
          <tr>
            <td className="border p-2">Transport Fee</td>
            <td><input value={fees.transport} onChange={e => setFees({...fees, transport: e.target.value})} /></td>
          </tr>
          <tr>
            <td className="border p-2">Misc Fee</td>
            <td><input value={fees.misc} onChange={e => setFees({...fees, misc: e.target.value})} /></td>
          </tr>
          <tr>
            <td className="border p-2">Other Fee</td>
            <td><input value={fees.other} onChange={e => setFees({...fees, other: e.target.value})} /></td>
          </tr>
        </tbody>
      </table>

      <button onClick={addPayment} className="border px-4 py-2 bg-black text-white">
        Save Payment
      </button>

      {/* PAYMENTS TABLE */}
      <table className="w-full border mt-6">
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
              <td className="border p-2">{new Date(p.date).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  )
}