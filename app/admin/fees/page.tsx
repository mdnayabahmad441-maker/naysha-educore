"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function FeesPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [students,setStudents] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])

  const [selectedStudent,setSelectedStudent] = useState("")
  const [amount,setAmount] = useState("")

  const [selectedFee,setSelectedFee] = useState("")
  const [payAmount,setPayAmount] = useState("")

  // 📊 SUMMARY
  const totalFees = fees.reduce((s,f)=>s + f.total_amount,0)
  const totalPaid = fees.reduce((s,f)=>s + f.paid_amount,0)
  const totalPending = totalFees - totalPaid

  // INIT SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD STUDENTS
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("students")
        .select("id,name")
        .eq("school_id", schoolId)

      setStudents(data || [])
    }

    load()
  },[schoolId])

  // LOAD FEES
  const loadFees = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("fees")
      .select(`
        *,
        students(name)
      `)
      .eq("school_id", schoolId)

    setFees(data || [])
  }

  // LOAD PAYMENTS
  const loadPayments = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("payments")
      .select(`
        *,
        students(name)
      `)
      .eq("school_id", schoolId)
      .order("date",{ascending:false})

    setPayments(data || [])
  }

  useEffect(()=>{
    loadFees()
    loadPayments()
  },[schoolId])

  // ➕ ADD FEE
  const addFee = async ()=>{
    if(!selectedStudent || !amount) return

    await supabase.from("fees").insert([
      {
        id: crypto.randomUUID(),
        student_id: selectedStudent,
        school_id: schoolId,
        total_amount: Number(amount)
      }
    ])

    setAmount("")
    loadFees()
  }

  // 💰 PAY + RECEIPT
  const pay = async ()=>{

    if(!selectedFee || !payAmount) return

    const fee = fees.find(f=>f.id === selectedFee)

    if(!fee) return

    const newPaid = fee.paid_amount + Number(payAmount)

    const receiptNumber = "RCPT-" + Date.now()

    // INSERT PAYMENT
    await supabase.from("payments").insert([
      {
        id: crypto.randomUUID(),
        student_id: fee.student_id,
        fee_id: selectedFee,
        amount: Number(payAmount),
        school_id: schoolId,
        receipt_number: receiptNumber,
        date: new Date()
      }
    ])

    // UPDATE FEE
    await supabase
      .from("fees")
      .update({
        paid_amount: newPaid,
        status: newPaid >= fee.total_amount ? "paid" : "pending"
      })
      .eq("id", selectedFee)

    setPayAmount("")

    loadFees()
    loadPayments()
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fees Dashboard</h1>

      {/* 📊 SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6">

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Total Fees</p>
          <h2 className="text-2xl font-bold mt-2">₹{totalFees}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Collected</p>
          <h2 className="text-2xl font-bold mt-2 text-green-400">₹{totalPaid}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Pending</p>
          <h2 className="text-2xl font-bold mt-2 text-yellow-400">₹{totalPending}</h2>
        </div>

      </div>

      {/* ➕ ADD FEE */}
      <div className="bg-white/10 p-6 rounded-xl flex flex-wrap gap-4">

        <select
          value={selectedStudent}
          onChange={(e)=>setSelectedStudent(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl border border-white/10"
        >
          <option value="">Select Student</option>
          {students.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input
          placeholder="Total Fee"
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl border border-white/10"
        />

        <button
          onClick={addFee}
          className="px-6 py-3 rounded-xl bg-purple-600"
        >
          Assign Fee
        </button>

      </div>

      {/* 💰 PAYMENT */}
      <div className="bg-white/10 p-6 rounded-xl flex flex-wrap gap-4">

        <select
          value={selectedFee}
          onChange={(e)=>setSelectedFee(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl border border-white/10"
        >
          <option value="">Select Fee</option>
          {fees.map(f=>(
            <option key={f.id} value={f.id}>
              {f.students?.name} (₹{f.total_amount})
            </option>
          ))}
        </select>

        <input
          placeholder="Pay Amount"
          value={payAmount}
          onChange={(e)=>setPayAmount(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl border border-white/10"
        />

        <button
          onClick={pay}
          className="px-6 py-3 rounded-xl bg-blue-600"
        >
          Collect Payment
        </button>

      </div>

      {/* 📋 FEES TABLE */}
      <div className="bg-white/10 p-6 rounded-xl overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Student</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Paid</th>
              <th className="p-3 text-left">Remaining</th>
              <th className="p-3 text-left">Status</th>
            </tr>
          </thead>

          <tbody>

            {fees.map(f=>{

              const remaining = f.total_amount - f.paid_amount

              return(
                <tr key={f.id} className="border-t border-white/10">

                  <td className="p-3">{f.students?.name}</td>
                  <td className="p-3">₹{f.total_amount}</td>
                  <td className="p-3 text-green-400">₹{f.paid_amount}</td>
                  <td className="p-3 text-yellow-400">₹{remaining}</td>

                  <td className="p-3">
                    {f.status === "paid"
                      ? "✅ Paid"
                      : "⚠ Pending"}
                  </td>

                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

      {/* 🧾 PAYMENTS / RECEIPTS */}
      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="mb-4 text-lg">Receipts</h2>

        <table className="w-full text-sm">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3">Student</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
              <th className="p-3">Receipt</th>
            </tr>
          </thead>

          <tbody>

            {payments.map(p=>(
              <tr key={p.id} className="border-t border-white/10">

                <td className="p-3">{p.students?.name}</td>
                <td className="p-3">₹{p.amount}</td>
                <td className="p-3">{p.date}</td>

                <td className="p-3">
                  <button
                    onClick={()=>window.open(`/admin/fees/receipt/${p.id}`)}
                    className="text-blue-400 hover:underline"
                  >
                    View
                  </button>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}