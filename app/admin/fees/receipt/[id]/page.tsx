"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

export default function ReceiptPage(){

  const { id } = useParams()

  const [payment,setPayment] = useState<any>(null)

  useEffect(()=>{

    const load = async ()=>{

      const { data } = await supabase
        .from("payments")
        .select(`
          *,
          students(name,email),
          fees(total_amount)
        `)
        .eq("id",id)
        .single()

      setPayment(data)
    }

    load()

  },[id])

  if(!payment){
    return <div className="p-10 text-white">Loading...</div>
  }

  return(

    <div className="min-h-screen bg-white text-black p-10">

      <div className="max-w-2xl mx-auto border p-8">

        <h1 className="text-2xl font-bold mb-4">
          Payment Receipt
        </h1>

        <p><b>Receipt No:</b> {payment.receipt_number}</p>
        <p><b>Date:</b> {payment.date}</p>

        <hr className="my-4"/>

        <p><b>Student:</b> {payment.students?.name}</p>
        <p><b>Email:</b> {payment.students?.email}</p>

        <hr className="my-4"/>

        <p><b>Total Fee:</b> ₹{payment.fees?.total_amount}</p>
        <p><b>Paid:</b> ₹{payment.amount}</p>

        <hr className="my-4"/>

        <h2 className="text-lg font-semibold">
          Thank you for your payment
        </h2>

        <button
          onClick={()=>window.print()}
          className="mt-6 px-6 py-3 bg-black text-white"
        >
          Print / Download
        </button>

      </div>

    </div>
  )
}