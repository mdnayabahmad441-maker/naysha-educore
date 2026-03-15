"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"

export default function PaymentsPage(){

  const [students,setStudents] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])

  const [studentId,setStudentId] = useState("")
  const [feeId,setFeeId] = useState("")
  const [amount,setAmount] = useState("")

  useEffect(()=>{

    const load = async()=>{

      const {data:s}=await supabase.from("students").select("*")
      const {data:f}=await supabase.from("fees").select("*")

      setStudents(s||[])
      setFees(f||[])

    }

    load()

  },[])

  const save = async()=>{

    await supabase
      .from("fee_payments")
      .insert({
        id:crypto.randomUUID(),
        student_id:studentId,
        fee_id:feeId,
        amount:Number(amount),
        payment_date:new Date()
      })

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Fee Payments</h1>

      <div className="flex gap-4">

        <select
          className="bg-slate-800 border border-white/20 p-2 rounded"
          onChange={(e)=>setStudentId(e.target.value)}
        >
          <option>Select Student</option>

          {students.map(s=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}

        </select>

        <select
          className="bg-slate-800 border border-white/20 p-2 rounded"
          onChange={(e)=>setFeeId(e.target.value)}
        >
          <option>Select Fee</option>

          {fees.map(f=>(
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}

        </select>

        <input
          className="bg-slate-800 border border-white/20 p-2 rounded"
          placeholder="Amount"
          onChange={(e)=>setAmount(e.target.value)}
        />

        <Button color="green" onClick={save}>
          Pay
        </Button>

      </div>

    </div>

  )

}