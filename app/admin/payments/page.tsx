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

  // 🔥 INIT SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // 🔥 LOAD STUDENTS
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

  // 🔥 LOAD FEES BASED ON STUDENT
  useEffect(()=>{

    if(!studentId) return

    const loadFees = async ()=>{

      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)

      setFees(data || [])
    }

    loadFees()

  },[studentId])

  // 💰 SAVE PAYMENT
  const save = async ()=>{

    if(!studentId || !feeId || !amount){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("payments")
      .insert({
        id: crypto.randomUUID(),
        student_id: studentId,
        fee_id: feeId,
        amount: Number(amount),
        school_id: schoolId,
        receipt_number: "RCPT-"+Date.now(),
        date: new Date()
      })

    if(error){
      console.error(error)
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Payment added ✅")

    // RESET
    setAmount("")
    setFeeId("")

    setLoading(false)
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Fee Payments
      </h1>

      <div className="flex flex-wrap gap-4 items-center">

        {/* STUDENT */}
        <select
          value={studentId}
          onChange={(e)=>{
            setStudentId(e.target.value)
            setFeeId("")
          }}
          className="bg-slate-800 border border-white/20 p-3 rounded"
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
          className="bg-slate-800 border border-white/20 p-3 rounded"
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
          className="bg-slate-800 border border-white/20 p-3 rounded"
        />

        {/* BUTTON */}
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