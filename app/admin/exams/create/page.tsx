"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function Page(){

const [name,setName]=useState("")
const [term,setTerm]=useState("")
const [date,setDate]=useState("")
const [exams,setExams]=useState<any[]>([])

async function load(){

const {data}=await supabase.from("exams").select("*")

setExams(data||[])

}

useEffect(()=>{load()},[])

async function createExam(){

await supabase.from("exams").insert({name,term,date})

load()

}

async function remove(id:string){

await supabase.from("exams").delete().eq("id",id)

load()

}

return(

<div className="p-10 text-white space-y-6">

<h1 className="text-2xl">Create Exam</h1>

<div className="bg-white/10 border border-white/20 rounded-xl p-6 space-y-4">

<input placeholder="Exam Name" className="p-2 text-black" onChange={e=>setName(e.target.value)}/>
<input placeholder="Term" className="p-2 text-black" onChange={e=>setTerm(e.target.value)}/>
<input type="date" className="p-2 text-black" onChange={e=>setDate(e.target.value)}/>

<button onClick={createExam} className="bg-green-600 px-4 py-2 rounded">Save</button>

</div>

<table className="w-full bg-white/10 border border-white/20">

<thead>

<tr>

<th>Name</th>
<th>Term</th>
<th>Date</th>
<th></th>

</tr>

</thead>

<tbody>

{exams.map(e=>(

<tr key={e.id}>

<td>{e.name}</td>
<td>{e.term}</td>
<td>{e.date}</td>

<td>

<button onClick={()=>remove(e.id)} className="bg-red-600 px-2 py-1 rounded">

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)
}