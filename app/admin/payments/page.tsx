"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import Button from "@/components/ui/Button"

export default function PaymentsPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [students,setStudents] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])

  const [studentId,setStudentId] = useState("")
  const [feeId,setFeeId] = useState("")
  const [amount,setAmount] = useState("")

  const [loading,setLoading] = useState(false)

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

    const loadStudents = async ()=>{
      const { data } = await supabase
        .from("students")
        .select("id,name")
        .eq("school_id", schoolId)

      setStudents(data || [])
    }

    loadStudents()

  },[schoolId])

  // LOAD FEES
  useEffect(()=>{
    if(!studentId) return

    const loadFees = async ()=>{
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      setFees(data || [])
    }

    loadFees()

  },[studentId,schoolId])

  // 💰 SAVE PAYMENT (🔥 FULL FIX)
  const save = async ()=>{

    if(!studentId || !feeId || !amount){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    try{

      const fee = fees.find(f=>f.id === feeId)
      if(!fee){
        alert("Fee not found")
        setLoading(false)
        return
      }

      const payAmount = Number(amount)
      const newPaid = (fee.paid_amount || 0) + payAmount

      // ✅ INSERT PAYMENT
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          id: crypto.randomUUID(),
          student_id: studentId,
          fee_id: feeId,
          amount: payAmount,
          school_id: schoolId,
          receipt_number: "RCPT-"+Date.now(),
          date: new Date()
        })

      if(paymentError){
        alert(paymentError.message)
        setLoading(false)
        return
      }

      // ✅ UPDATE FEE (🔥 IMPORTANT)
      const { error: feeError } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.total_amount ? "paid" : "pending"
        })
        .eq("id", feeId)
        .eq("school_id", schoolId)

      if(feeError){
        alert(feeError.message)
        setLoading(false)
        return
      }

      alert("Payment successful ✅")

      setAmount("")
      setFeeId("")

    }catch(err){
      console.error(err)
    }

    setLoading(false)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Fee Payments
      </h1>

      <div className="bg-white/10 p-6 rounded-xl flex flex-wrap gap-4">

        {/* STUDENT */}
        <select
          value={studentId}
          onChange={(e)=>{
            setStudentId(e.target.value)
            setFeeId("")
          }}
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl"
        >
          <option value="">Select Student</option>

          {students.map(s=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* FEES */}
        <select
          value={feeId}
          onChange={(e)=>setFeeId(e.target.value)}
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl"
        >
          <option value="">Select Fee</option>

          {fees.map(f=>(
            <option key={f.id} value={f.id}>
              ₹{f.total_amount} ({f.status})
            </option>
          ))}
        </select>

        {/* AMOUNT */}
        <input
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          placeholder="Enter Amount"
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl"
        />

        <Button
          color="green"
          onClick={save}
          disabled={loading}
        >
          {loading ? "Processing..." : "Pay"}
        </Button>

      </div>

    </div>

  )
}