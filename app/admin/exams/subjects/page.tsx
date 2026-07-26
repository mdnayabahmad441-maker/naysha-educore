"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

const [rows,setRows]=useState<any[]>([])

useEffect(()=>{

async function load(){

const {data} = await supabase
.from("class_subjects")
.select(`
id,
class,
max_marks,
pass_marks,
subjects(name)
`)
.order("class")

setRows(data || [])

}

load()

},[])

const grouped = rows.reduce((acc:any,row)=>{

if(!acc[row.class]) acc[row.class]=[]

acc[row.class].push(row)

return acc

},{})
  
return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6">Subjects by Class</h1>

{Object.keys(grouped).map(cls => (

<div
key={cls}
className="bg-white/10 border border-white/20 rounded-xl p-6 mb-6"
>

<h2 className="text-lg mb-4">Class {cls}</h2>

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">Subject</th>
<th className="p-2 text-left">Max Marks</th>
<th className="p-2 text-left">Pass Marks</th>

</tr>

</thead>

<tbody>

{grouped[cls].map((r:any)=>(
<tr key={r.id}>

<td className="p-2">{r.subjects?.name}</td>
<td className="p-2">{r.max_marks}</td>
<td className="p-2">{r.pass_marks}</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

))}

</div>

)

}