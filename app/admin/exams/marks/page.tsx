"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function Page(){

const [students,setStudents]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [marks,setMarks]=useState<Record<string,string>>({})

useEffect(()=>{

async function load(){

const {data:st}=await supabase.from("students").select("*")
const {data:sub}=await supabase.from("subjects").select("*")

setStudents(st||[])
setSubjects(sub||[])

}

load()

},[])

function update(student:string,subject:string,value:string){

const key=`${student}-${subject}`

setMarks(prev=>({...prev,[key]:value}))

}

function total(student:string){

let t=0

subjects.forEach(s=>{

const v=marks[`${student}-${s.id}`]

if(Number(v)) t+=Number(v)

})

return t

}

return(

<div className="p-10 text-white">

<h1 className="text-2xl mb-6">Marks Entry</h1>

<div className="overflow-auto bg-white/10 border border-white/20 rounded-xl">

<table className="min-w-full">

<thead>

<tr>

<th>Student</th>

{subjects.map(s=>(

<th key={s.id}>{s.name}</th>

))}

<th>Total</th>
<th>%</th>

</tr>

</thead>

<tbody>

{students.map(st=>{

const t=total(st.id)
const max=subjects.length*100
const p=((t/max)*100).toFixed(2)

return(

<tr key={st.id}>

<td>{st.name}</td>

{subjects.map(s=>{

const key=`${st.id}-${s.id}`

return(

<td key={s.id}>

<input

value={marks[key]||""}

onChange={e=>update(st.id,s.id,e.target.value)}

className="w-16 text-black text-center"

/>

</td>

)

})}

<td>{t}</td>
<td>{p}</td>

</tr>

)

})}

</tbody>

</table>

</div>

<div className="flex gap-4 mt-6">

<button className="bg-green-600 px-4 py-2 rounded">Save Marks</button>

<button className="bg-yellow-500 px-4 py-2 rounded">Verify Marks</button>

<button className="bg-purple-600 px-4 py-2 rounded">Create Results</button>

<button className="bg-red-600 px-4 py-2 rounded">Publish Results</button>

</div>

</div>

)
}