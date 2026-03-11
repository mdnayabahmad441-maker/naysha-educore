"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Results(){

const [results,setResults] = useState<any[]>([])

useEffect(()=>{
loadResults()
},[])

async function loadResults(){

const {data:students} = await supabase
.from("students")
.select("*")

let final:any[]=[]

for(const st of students||[]){

const {data:marks} = await supabase
.from("marks")
.select("marks")

.eq("student_id",st.id)

let total=0

marks?.forEach((m:any)=>total+=m.marks)

const percentage = marks?.length ? total/marks.length : 0

final.push({
name:st.name,
class:st.class,
total,
percentage
})

}

final.sort((a,b)=>b.percentage-a.percentage)

final.forEach((s,i)=>s.rank=i+1)

setResults(final)

}

function getColor(p:any){

if(p<33) return "bg-red-500"
if(p<=60) return "bg-yellow-400"
if(p<=80) return "bg-green-300"
return "bg-green-600"

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl mb-6">
Exam Results
</h1>

<table className="w-full">

<thead className="bg-white/10">

<tr>

<th>Rank</th>
<th>Student</th>
<th>Class</th>
<th>Total</th>
<th>%</th>

</tr>

</thead>

<tbody>

{results.map(r=>(
<tr key={r.name} className={getColor(r.percentage)}>

<td>{r.rank}</td>
<td>{r.name}</td>
<td>{r.class}</td>
<td>{r.total}</td>
<td>{r.percentage.toFixed(1)}%</td>

</tr>
))}

</tbody>

</table>

</div>

)

}