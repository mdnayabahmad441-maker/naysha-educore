"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function PaymentsPage() {
  const [fees, setFees] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])

  const [search, setSearch] = useState("")
  const [filterClass, setFilterClass] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    student_id: "",
    school: "",
    hostel: "",
    transport: "",
    misc: ""
  })

  // ================= LOAD DATA =================
  const loadData = async () => {
    const { data } = await supabase
      .from("fees")
      .select(`
        id,
        amount,
        paid_amount,
        status,
        created_at,
        students(name),
        classes(name)
      `)

    setFees(data || [])
  }

  const loadStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id,name")

    setStudents(data || [])
  }

  const loadClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("id,name")

    setClasses(data || [])
  }

  useEffect(() => {
    loadData()
    loadStudents()
    loadClasses()
  }, [])

  // ================= FILTER =================
  const filtered = fees.filter((row) => {
    const matchSearch =
      row.students?.name?.toLowerCase().includes(search.toLowerCase())

    const matchClass =
      !filterClass || row.classes?.name === filterClass

    const matchStatus =
      !filterStatus || row.status === filterStatus

    return matchSearch && matchClass && matchStatus
  })

  // ================= STATS =================
  const totalCollected = fees.reduce((sum, r) => sum + (r.paid_amount || 0), 0)

  const totalPending = fees.reduce(
    (sum, r) => sum + (r.amount - r.paid_amount),
    0
  )

  const thisMonth = fees.reduce((sum, r) => {
    const d = new Date(r.created_at)
    const now = new Date()
    if (d.getMonth() === now.getMonth()) {
      return sum + (r.paid_amount || 0)
    }
    return sum
  }, 0)

  // ================= ADD PAYMENT =================
  const handleSave = async () => {
    const total =
      Number(form.school || 0) +
      Number(form.hostel || 0) +
      Number(form.transport || 0) +
      Number(form.misc || 0)

    if (!form.student_id || total === 0) {
      alert("Fill all fields")
      return
    }

    // insert into payments table
    await supabase.from("payments").insert({
      student_id: form.student_id,
      amount: total,
      date: new Date().toISOString(),
      receipt_number: "RCP-" + Date.now()
    })

    alert("Payment added")
    setShowModal(false)
    loadData()
  }

  return (
    <div className="p-6 bg-white min-h-screen text-black">

      <h1 className="text-2xl font-semibold mb-4">Payments</h1>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="border p-4">
          <p className="text-sm">Total Collected</p>
          <p className="text-xl font-bold">₹ {totalCollected}</p>
        </div>

        <div className="border p-4">
          <p className="text-sm">Total Pending</p>
          <p className="text-xl font-bold">₹ {totalPending}</p>
        </div>

        <div className="border p-4">
          <p className="text-sm">This Month</p>
          <p className="text-xl font-bold">₹ {thisMonth}</p>
        </div>

      </div>

      {/* ================= FILTER ================= */}
      <div className="flex gap-3 mb-4">

        <input
          placeholder="Search student"
          className="border p-2 w-64"
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2"
          onChange={(e) => setFilterClass(e.target.value)}
        >
          <option value="">All Classes</option>
          {classes.map(c => (
            <option key={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          className="border p-2"
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="pending">Due</option>
        </select>

        <button
          onClick={() => setShowModal(true)}
          className="border px-4"
        >
          + Add Payment
        </button>

      </div>

      {/* ================= TABLE ================= */}
      <table className="w-full border text-sm">

        <thead>
          <tr>
            <th className="border p-2">Student</th>
            <th className="border p-2">Class</th>
            <th className="border p-2">Total</th>
            <th className="border p-2">Paid</th>
            <th className="border p-2">Due</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Progress</th>
            <th className="border p-2">Date</th>
          </tr>
        </thead>

        <tbody>
          {filtered.map((r) => {
            const due = r.amount - r.paid_amount
            const percent = (r.paid_amount / r.amount) * 100 || 0

            return (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="border p-2">{r.students?.name}</td>
                <td className="border p-2">{r.classes?.name}</td>
                <td className="border p-2">₹ {r.amount}</td>
                <td className="border p-2">₹ {r.paid_amount}</td>
                <td className="border p-2">₹ {due}</td>
                <td className="border p-2">{r.status}</td>
                <td className="border p-2">
                  <div className="w-full bg-gray-200 h-2">
                    <div
                      style={{ width: percent + "%", background: "#2563eb", height: "100%" }}
                    />
                  </div>
                </td>
                <td className="border p-2">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
              </tr>
            )
          })}
        </tbody>

      </table>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center">

          <div className="bg-white border p-6 w-96">

            <h2 className="mb-3 font-semibold">Add Payment</h2>

            <select
              className="border p-2 w-full mb-2"
              onChange={(e) =>
                setForm({ ...form, student_id: e.target.value })
              }
            >
              <option>Select Student</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <input
              placeholder="School Fee"
              className="border p-2 w-full mb-2"
              onChange={(e) =>
                setForm({ ...form, school: e.target.value })
              }
            />

            <input
              placeholder="Hostel Fee"
              className="border p-2 w-full mb-2"
              onChange={(e) =>
                setForm({ ...form, hostel: e.target.value })
              }
            />

            <input
              placeholder="Transport Fee"
              className="border p-2 w-full mb-2"
              onChange={(e) =>
                setForm({ ...form, transport: e.target.value })
              }
            />

            <input
              placeholder="Misc Fee"
              className="border p-2 w-full mb-4"
              onChange={(e) =>
                setForm({ ...form, misc: e.target.value })
              }
            />

            <button
              onClick={handleSave}
              className="border px-4 py-2 w-full"
            >
              Save Payment
            </button>

          </div>

        </div>
      )}

    </div>
  )
}