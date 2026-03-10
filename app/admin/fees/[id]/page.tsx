"use client"

import { useEffect,useState,useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import { useReactToPrint } from "react-to-print"

export default function InvoicePage(){

const params = useParams()
const componentRef = useRef(null)

const [invoice,setInvoice] = useState<any>(null)

useEffect(()=>{
loadInvoice()
},[])


async function loadInvoice(){

const { data } =
await supabase
.from("fees")
.select(`
*,
students(name,class)
`)
.eq("id",params.id)
.single()

if(data){
setInvoice(data)
}

}


const handlePrint = useReactToPrint({
  contentRef: componentRef
})

if(!invoice){

return(
<div className="p-10 text-white">
Loading invoice...
</div>
)

}


return(

<div className="p-10 text-white">

<button
onClick={handlePrint}
className="mb-6 px-4 py-2 bg-green-600 rounded"
>
Download / Print Invoice
</button>


<div
ref={componentRef}
className="bg-white text-black p-10 rounded w-[700px]"
>

<h1 className="text-3xl font-bold mb-6">
School Fee Invoice
</h1>

<div className="mb-6">

<p><b>Invoice No:</b> {invoice.invoice_number}</p>
<p><b>Student:</b> {invoice.students?.name}</p>
<p><b>Class:</b> {invoice.students?.class}</p>

</div>


<table className="w-full border">

<thead>

<tr className="border">

<th className="border p-2 text-left">Fee Type</th>
<th className="border p-2 text-left">Amount</th>

</tr>

</thead>

<tbody>

<tr>
<td className="border p-2">Tuition Fee</td>
<td className="border p-2">₹{invoice.tuition_fee}</td>
</tr>

<tr>
<td className="border p-2">Hostel Fee</td>
<td className="border p-2">₹{invoice.hostel_fee}</td>
</tr>

<tr>
<td className="border p-2">Misc Fee</td>
<td className="border p-2">₹{invoice.misc_fee}</td>
</tr>

<tr>
<td className="border p-2">Other Fee</td>
<td className="border p-2">₹{invoice.other_fee}</td>
</tr>

<tr className="font-bold">

<td className="border p-2">Total</td>
<td className="border p-2">₹{invoice.total}</td>

</tr>

</tbody>

</table>


<div className="mt-10">

<p>Signature: __________________</p>

</div>

</div>

</div>

)

}