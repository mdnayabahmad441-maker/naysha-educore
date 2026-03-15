"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ExamSubjects(){

const [rows,setRows]=useState<any[]>([])

useEffect(()=>{

supabase
.from("exam_subjects")
.select(`
subject_id,
full_marks,
pass_marks,
subjects(name)
`)
.then(res=>setRows(res.data || []))

},[])

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6">Exam Subjects</h1>

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

{rows.map(r=>(
<tr key={r.subject_id}>

<td className="p-2">{r.subjects?.name}</td>
<td className="p-2">{r.full_marks}</td>
<td className="p-2">{r.pass_marks}</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

)

}