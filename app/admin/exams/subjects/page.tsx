"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

const [name,setName]=useState("")
const [subjects,setSubjects]=useState<any[]>([])

async function load(){
const {data}=await supabase.from("subjects").select("*")
setSubjects(data||[])
}

useEffect(()=>{load()},[])

async function add(){
await supabase.from("subjects").insert({name})
setName("")
load()
}

async function remove(id:string){
await supabase.from("subjects").delete().eq("id",id)
load()
}

return(

<div className="p-8">

<h1 className="text-xl font-bold mb-4">Subjects</h1>

<div className="flex gap-3 mb-6">

<input
value={name}
onChange={(e)=>setName(e.target.value)}
className="border p-2"
placeholder="Subject"
/>

<button onClick={add}
className="bg-blue-600 text-white px-4 py-2 rounded">
Add
</button>

</div>

<table className="w-full border">

<thead>
<tr className="bg-gray-100">
<th>Subject</th>
<th></th>
</tr>
</thead>

<tbody>
{subjects.map((s)=>(
<tr key={s.id} className="border-t">

<td>{s.name}</td>

<td>
<button
onClick={()=>remove(s.id)}
className="text-red-600">
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