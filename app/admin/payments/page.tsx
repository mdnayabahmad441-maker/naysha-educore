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

  // ================= INIT SCHOOL =================
  useEffect(()=>{
    getSchoolId().then((id)=>{
      console.log("School ID:", id)
      setSchoolId(id)
    })
  },[])

  // ================= LOAD STUDENTS (FIXED PROPERLY) =================
  useEffect(()=>{
    if(!schoolId) return

    const loadStudents = async ()=>{

      const { data, error } = await supabase
        .from("students")
        .select("id,name")
        .eq("school_id", schoolId) // ✅ FIXED (no cross-school)

      if(error){
        console.error("Students load error:", error)
        return
      }

      setStudents(data || [])
    }

    loadStudents()

  },[schoolId])

  // ================= LOAD FEES =================
  useEffect(()=>{
    if(!studentId || !schoolId) return

    const loadFees = async ()=>{

      const { data, error } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      if(error){
        console.error("Fees load error:", error)
        return
      }

      setFees(data || [])
    }

    loadFees()

  },[studentId,schoolId])

  // ================= SAVE PAYMENT =================
  const save = async ()=>{

    if(!studentId || !feeId || !amount){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not loaded")
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

      if(payAmount <= 0){
        alert("Invalid amount")
        setLoading(false)
        return
      }

      const newPaid = (fee.paid_amount || 0) + payAmount

      const paymentId = crypto.randomUUID()

      // ================= INSERT PAYMENT =================
      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          student_id: studentId,
          fee_id: feeId,
          amount: payAmount,
          school_id: schoolId,
          receipt_number: "RCPT-"+Date.now(),
          date: new Date().toISOString()
        })

      if(paymentError){
        console.error(paymentError)
        alert(paymentError.message)
        setLoading(false)
        return
      }

      // ================= UPDATE FEE =================
      const { error: feeError } = await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.total_amount ? "paid" : "partial"
        })
        .eq("id", feeId)
        .eq("school_id", schoolId)

      if(feeError){
        console.error(feeError)
        alert(feeError.message)
        setLoading(false)
        return
      }

      // ================= 🔥 NOTIFICATION WITH RESULT =================
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

        console.log("NOTIFY RESULT:", notifyResult)

      }catch(err){
        console.error("Notification error:", err)
      }

      // ================= SUCCESS MESSAGE =================
      alert(`
Payment successful ✅

Email: ${notifyResult?.emailStatus || "unknown"}
WhatsApp: ${notifyResult?.whatsappStatus || "unknown"}
`)

      // RESET
      setAmount("")
      setFeeId("")

      // RELOAD FEES
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      setFees(data || [])

    }catch(err){
      console.error("Payment error:", err)
      alert("Something went wrong")
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