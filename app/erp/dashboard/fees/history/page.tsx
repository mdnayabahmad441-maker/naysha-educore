"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function FeesHistory(){

const [invoices,setInvoices] = useState<any[]>([])
const router = useRouter()

async function loadInvoices(){

const {data,error} =
await supabase
.from("fees")
.select("*")
.order("created_at",{ascending:false})

if(data){
setInvoices(data)
}

}

useEffect(()=>{
loadInvoices()
},[])

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Invoice History
</h1>

<div className="bg-white/10 p-6 rounded-xl">

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left p-2">Invoice</th>
<th className="text-left p-2">Student</th>
<th className="text-left p-2">Class</th>
<th className="text-left p-2">Total</th>
<th className="text-left p-2">Paid</th>
<th className="text-left p-2">Balance</th>
<th className="text-left p-2">Status</th>

</tr>

</thead>

<tbody>

{invoices.map((i)=>(

<tr
key={i.id}
className="border-b border-white/10 cursor-pointer hover:bg-white/5"
onClick={()=>router.push(`/erp/dashboard/fees/${i.id}`)}
>

<td className="p-2">{i.invoice_number}</td>
<td>{i.student_name}</td>
<td>{i.class}</td>
<td>₹{i.total}</td>
<td>₹{i.paid_amount}</td>
<td>₹{i.balance}</td>
<td>{i.status}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}