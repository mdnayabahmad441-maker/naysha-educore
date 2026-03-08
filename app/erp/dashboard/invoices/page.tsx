"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function InvoicesPage(){

  const [invoices,setInvoices] = useState<any[]>([])

  async function fetchInvoices(){

    const {data} = await supabase
      .from("fees")
      .select("*,students(name)")

    if(data) setInvoices(data)
  }

  useEffect(()=>{
    fetchInvoices()
  },[])

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Invoice History
      </h1>

      <table className="w-full">

        <thead>
          <tr className="text-left text-gray-400">
            <th>Invoice</th>
            <th>Student</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>

          {invoices.map((i)=>(
            <tr key={i.id} className="border-t border-gray-700">

              <td>{i.invoice_number}</td>
              <td>{i.students?.name}</td>
              <td>₹{i.total}</td>
              <td>{new Date(i.paid_date).toLocaleDateString()}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}