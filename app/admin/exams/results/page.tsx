"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Results(){

const [rows,setRows]=useState<any[]>([])

async function load(){

const {data}=await supabase
.from("exam_results")
.select("*,students(name,class)")

setRows(data||[])

}

useEffect(()=>{load()},[])

return(

<div className="p-8">

<h1 className="text-xl font-bold mb-6">Results</h1>

<table className="w-full border">

<thead>
<tr className="bg-gray-100">
<th>Rank</th>
<th>Student</th>
<th>Total</th>
<th>%</th>
<th>Grade</th>
<th>Status</th>
</tr>
</thead>

<tbody>

{rows.map((r)=>{

const color =
r.status==="FAIL"
? "bg-red-100"
: r.percentage>80
? "bg-green-200"
: r.percentage>60
? "bg-green-100"
: "bg-yellow-100"

return(

<tr key={r.id} className={color}>

<td>{r.rank}</td>
<td>{r.students?.name}</td>
<td>{r.total}</td>
<td>{r.percentage}</td>
<td>{r.grade}</td>
<td>{r.status}</td>

</tr>

)

})}

</tbody>

</table>

</div>

)
}