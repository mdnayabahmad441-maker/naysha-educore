"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ClassSubjects(){

const [rows,setRows]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [className,setClass]=useState("")
const [subject,setSubject]=useState("")
const [max,setMax]=useState("")
const [pass,setPass]=useState("")

async function load(){

const {data}=await supabase
.from("class_subjects")
.select("*,subjects(name)")

setRows(data||[])

const {data:subs}=await supabase.from("subjects").select("*")
setSubjects(subs||[])

}

useEffect(()=>{load()},[])

async function add(){

await supabase.from("class_subjects").insert({
class:className,
subject_id:subject,
max_marks:max,
pass_marks:pass
})

load()
}

return(

<div className="p-8 space-y-6">

<h1 className="text-xl font-bold">Class Subjects</h1>

<div className="flex gap-3">

<input
placeholder="Class"
onChange={(e)=>setClass(e.target.value)}
className="border p-2"
/>

<select
onChange={(e)=>setSubject(e.target.value)}
className="border p-2">

<option>Select Subject</option>

{subjects.map((s)=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}

</select>

<input
placeholder="Max"
onChange={(e)=>setMax(e.target.value)}
className="border p-2"
/>

<input
placeholder="Pass"
onChange={(e)=>setPass(e.target.value)}
className="border p-2"
/>

<button
onClick={add}
className="bg-blue-600 text-white px-4 py-2 rounded">
Add
</button>

</div>

<table className="w-full border">

<thead>
<tr className="bg-gray-100">
<th>Class</th>
<th>Subject</th>
<th>Max</th>
<th>Pass</th>
</tr>
</thead>

<tbody>

{rows.map((r)=>(
<tr key={r.id} className="border-t">
<td>{r.class}</td>
<td>{r.subjects?.name}</td>
<td>{r.max_marks}</td>
<td>{r.pass_marks}</td>
</tr>
))}

</tbody>

</table>

</div>

)
}