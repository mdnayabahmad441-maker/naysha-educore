"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

const [results,setResults] = useState<any[]>([])

useEffect(()=>{
loadResults()
},[])

async function loadResults(){

const { data:marks } = await supabase
.from("marks")
.select("*")

if(!marks) return

let final:any[] = []

for(const m of marks){

const { data:student } = await supabase
.from("students")
.select("name")
.eq("id",m.student_id)
.single()

const { data:exam } = await supabase
.from("exams")
.select("name")
.eq("id",m.exam_id)
.single()

final.push({
id:m.id,
student:student?.name,
exam:exam?.name,
marks:m.marks
})

}

setResults(final)

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Exam Results
</h1>

<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">
<th className="p-2">Student</th>
<th className="p-2">Exam</th>
<th className="p-2">Marks</th>
</tr>

</thead>

<tbody>

{results.map(r=>(
<tr key={r.id}>
<td className="p-2">{r.student}</td>
<td className="p-2">{r.exam}</td>
<td className="p-2">{r.marks}</td>
</tr>
))}

</tbody>

</table>

</div>

)

}