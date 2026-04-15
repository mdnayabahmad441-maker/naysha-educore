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
  const [paymentDate,setPaymentDate] = useState("")

  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD STUDENTS =================
  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("students")
      .select("id,name")
      .eq("school_id", schoolId)
      .then(({data})=>setStudents(data || []))

  },[schoolId])

  // ================= LOAD FEES =================
  useEffect(()=>{
    if(!studentId || !schoolId) return

    supabase
      .from("fees")
      .select("*")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .then(({data})=>setFees(data || []))

  },[studentId,schoolId])

  // ================= DATE VALIDATION =================
  const validateDate = ()=>{
    if(!paymentDate) return true

    const selected = new Date(paymentDate)
    const today = new Date()
    today.setHours(0,0,0,0)

    if(selected > today){
      setError("Future payments are not allowed")
      return false
    }

    setError("")
    return true
  }

  // ================= SAVE =================
  const save = async ()=>{

    if(!studentId || !feeId || !amount){
      setError("Please fill all fields")
      return
    }

    if(!validateDate()) return

    if(!schoolId){
      setError("School not loaded")
      return
    }

    const payAmount = Number(amount)

    if(payAmount <= 0){
      setError("Invalid amount")
      return
    }

    const selectedDate = paymentDate
      ? new Date(paymentDate)
      : new Date()

    const today = new Date()
    today.setHours(0,0,0,0)

    const isManual = selectedDate < today

    setLoading(true)
    setError("")

    try{

      const fee = fees.find(f=>f.id === feeId)

      if(!fee){
        setError("Fee not found")
        setLoading(false)
        return
      }

      const newPaid = (fee.paid_amount || 0) + payAmount
      const paymentId = crypto.randomUUID()

      // ================= INSERT =================
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          student_id: studentId,
          fee_id: feeId,
          amount: payAmount,
          school_id: schoolId,
          receipt_number: "RCPT-"+Date.now(),
          date: new Date().toISOString(),
          payment_date: selectedDate.toISOString(),
          is_manual: isManual
        })

      if(paymentError){
        setError(paymentError.message)
        setLoading(false)
        return
      }

      // ================= UPDATE FEE =================
      await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.total_amount ? "paid" : "partial"
        })
        .eq("id", feeId)
        .eq("school_id", schoolId)

      // ================= NOTIFY =================
      let notifyResult:any = {}

      try{
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment",
            refId: paymentId
          })
        })

        notifyResult = await res.json()
      }catch{}

      // ================= SUCCESS UI =================
      setError("")

      alert(`
Payment successful ✅

${isManual ? "⚠️ Manual Entry (Past Date)" : "Real-time Payment"}

Email: ${notifyResult?.emailStatus || "unknown"}
WhatsApp: ${notifyResult?.whatsappStatus || "unknown"}
`)

      setAmount("")
      setFeeId("")
      setPaymentDate("")

      // reload
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      setFees(data || [])

    }catch(err){
      console.error(err)
      setError("Something went wrong")
    }

    setLoading(false)
  }

  // ================= UI =================
  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fee Payments</h1>

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
            <option key={s.id} value={s.id}>{s.name}</option>
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

        {/* DATE */}
        <input
          type="date"
          value={paymentDate}
          onChange={(e)=>{
            setPaymentDate(e.target.value)
            setError("")
          }}
          max={new Date().toISOString().split("T")[0]} // ✅ prevents future selection
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl"
        />

        <Button
          color="green"
          onClick={save}
          disabled={loading || !!error}
        >
          {loading ? "Processing..." : "Pay"}
        </Button>

      </div>

      {/* 🔥 CLEAN ERROR UI */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-xl">
          {error}
        </div>
      )}

    </div>
  )
}