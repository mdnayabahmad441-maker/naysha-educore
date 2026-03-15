"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page(){

const [rows,setRows]=useState<any[]>([])

useEffect(()=>{

supabase
.from("exam_results")
.select("*,students(name,class)")
.then(res=>setRows(res.data||[]))

},[])

return(

<div className="p-10 text-white">

<h1 className="text-2xl mb-6">Results</h1>

<table className="w-full bg-white/10 border border-white/20">

<thead>

<tr>

<th>Rank</th>
<th>Student</th>
<th>Total</th>
<th>%</th>
<th>Grade</th>
<th>Status</th>

</tr>

</thead>

<tbody>

{rows.map(r=>(

<tr key={r.id}>

<td>{r.rank}</td>
<td>{r.students?.name}</td>
<td>{r.total}</td>
<td>{r.percentage}</td>
<td>{r.grade}</td>
<td>{r.status}</td>

</tr>

))}

</tbody>

</table>

</div>

)
}