"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page(){

const [rows,setRows]=useState<any[]>([])

useEffect(()=>{

supabase
.from("class_subjects")
.select("*,subjects(name)")
.then(res=>setRows(res.data||[]))

},[])

const grouped=rows.reduce((acc:any,row)=>{

if(!acc[row.class]) acc[row.class]=[]

acc[row.class].push(row)

return acc

},{})

return(

<div className="p-10 text-white">

<h1 className="text-2xl mb-6">Subjects by Class</h1>

{Object.keys(grouped).map(c=>(

<div key={c} className="mb-8 bg-white/10 border border-white/20 rounded-xl p-6">

<h2 className="mb-4">Class {c}</h2>

<table className="w-full">

<thead>

<tr>

<th>Subject</th>
<th>Max</th>
<th>Pass</th>

</tr>

</thead>

<tbody>

{grouped[c].map((r:any)=>(

<tr key={r.id}>

<td>{r.subjects?.name}</td>
<td>{r.max_marks}</td>
<td>{r.pass_marks}</td>

</tr>

))}

</tbody>

</table>

</div>

))}

</div>

)
}