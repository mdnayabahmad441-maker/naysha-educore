"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import FeeReceipt from "@/components/fees/FeeReceipt"

export default function Page({ params }:any){

  const [data,setData] = useState<any>(null)

  useEffect(()=>{
    const load = async ()=>{
      const { data: receipt } = await supabase
        .from("receipts")
        .select("*")
        .eq("id",params.id)
        .single()

      const { data: fee } = await supabase
        .from("fees")
        .select("*")
        .eq("id",receipt.fee_id)
        .single()

      const { data: student } = await supabase
        .from("students")
        .select("*")
        .eq("id",receipt.student_id)
        .single()

      setData({ receipt, fee, student })
    }

    load()
  },[])

  if(!data) return "Loading..."

  return(
    <FeeReceipt
      student={data.student}
      fee={data.fee}
      payment={{
        amount:data.receipt.amount,
        date:data.receipt.created_at,
        id:data.receipt.receipt_number
      }}
    />
  )
}