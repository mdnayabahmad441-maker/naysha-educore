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

let studentMap:any = {}

for(const m of marks){

const { data:student } = await supabase
.from("students")
.select("name")
.eq("id",m.student_id)
.single()

if(!student) continue

if(!studentMap[m.student_id]){

studentMap[m.student_id] = {
student: student.name,
total:0,
subjects:0
}

}

studentMap[m.student_id].total += m.marks
studentMap[m.student_id].subjects += 1

}

let arr = Object.values(studentMap).map((s:any)=>{

let percentage = s.total / s.subjects

let grade = "D"

if(percentage >= 90) grade="A+"
else if(percentage >= 80) grade="A"
else if(percentage >= 70) grade="B"
else if(percentage >= 60) grade="C"

return {
student:s.student,
total:s.total,
percentage:percentage.toFixed(2),
grade
}

})

arr.sort((a,b)=>b.total-a.total)

arr = arr.map((s:any,i)=>({
...s,
rank:i+1
}))

setResults(arr)

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
<th className="p-2">Total</th>
<th className="p-2">%</th>
<th className="p-2">Grade</th>
<th className="p-2">Rank</th>

</tr>

</thead>

<tbody>

{results.map((r:any,i)=>(

<tr key={i}>

<td className="p-2">{r.student}</td>
<td className="p-2">{r.total}</td>
<td className="p-2">{r.percentage}</td>
<td className="p-2">{r.grade}</td>
<td className="p-2">{r.rank}</td>

</tr>

))}

</tbody>

</table>

</div>

)

}