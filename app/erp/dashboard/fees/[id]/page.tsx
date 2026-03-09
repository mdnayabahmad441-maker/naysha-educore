"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

export default function InvoicePage(){

const params = useParams()
const [invoice,setInvoice] = useState<any>(null)

async function loadInvoice(){

const {data} =
await supabase
.from("fees")
.select("*")
.eq("id",params.id)
.single()

if(data){
setInvoice(data)
}

}

useEffect(()=>{
loadInvoice()
},[])

if(!invoice){
return <p className="p-10">Loading...</p>
}

return(

<div className="p-10 text-white">

<div className="bg-white/10 p-8 rounded-xl max-w-xl">

<h1 className="text-2xl font-bold mb-6">
Invoice {invoice.invoice_number}
</h1>

<p>Student: {invoice.student_name}</p>
<p>Class: {invoice.class}</p>

<hr className="my-4"/>

<p>School Fee: ₹{invoice.school_fee}</p>
<p>Exam Fee: ₹{invoice.exam_fee}</p>
<p>Hostel Fee: ₹{invoice.hostel_fee}</p>
<p>Misc Fee: ₹{invoice.misc_fee}</p>
<p>Other Fee: ₹{invoice.other_fee}</p>

<hr className="my-4"/>

<p>Total: ₹{invoice.total}</p>
<p>Paid: ₹{invoice.paid_amount}</p>
<p>Balance: ₹{invoice.balance}</p>

<p>Status: {invoice.status}</p>

<button
onClick={()=>window.print()}
className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Download / Print Invoice

</button>

</div>

</div>

)

}