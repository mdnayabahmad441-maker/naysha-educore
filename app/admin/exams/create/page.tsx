"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExamPage(){

const [name,setName]=useState("")
const [term,setTerm]=useState("")
const [date,setDate]=useState("")
const [exams,setExams]=useState<any[]>([])

async function load(){

const {data} = await supabase
.from("exams")
.select("*")
.order("date")

setExams(data || [])

}

useEffect(()=>{load()},[])

async function createExam(){

await supabase.from("exams").insert({
name,
term,
date
})

setName("")
setTerm("")
setDate("")

load()

}

async function deleteExam(id:string){

await supabase.from("exams").delete().eq("id",id)

load()

}

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6">Create Exam</h1>

<div className="bg-white/10 border border-white/20 rounded-xl p-6 mb-8">

<div className="flex gap-4 flex-wrap">

<input
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder="Exam Name"
className="text-black p-2 rounded"
/>

<input
value={term}
onChange={(e)=>setTerm(e.target.value)}
placeholder="Term"
className="text-black p-2 rounded"
/>

<input
type="date"
value={date}
onChange={(e)=>setDate(e.target.value)}
className="text-black p-2 rounded"
/>

<button
onClick={createExam}
className="bg-green-600 px-4 py-2 rounded"
>

Save

</button>

</div>

</div>

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">Exam</th>
<th className="p-2 text-left">Term</th>
<th className="p-2 text-left">Date</th>
<th className="p-2 text-left">Action</th>

</tr>

</thead>

<tbody>

{exams.map(exam=>(
<tr key={exam.id}>

<td className="p-2">{exam.name}</td>
<td className="p-2">{exam.term}</td>
<td className="p-2">{exam.date}</td>

<td className="p-2">

<button
onClick={()=>deleteExam(exam.id)}
className="bg-red-600 px-3 py-1 rounded"
>
Delete
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

)

}