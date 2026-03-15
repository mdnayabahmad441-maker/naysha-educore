"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ClassSubjectsPage(){

const classes = [
"Nursery","LKG","UKG",
"01","02","03","04","05",
"06","07","08","09","10"
]

const [subjects,setSubjects] = useState<any[]>([])
const [classSubjects,setClassSubjects] = useState<any[]>([])

const [selectedClass,setSelectedClass] = useState("")
const [subject,setSubject] = useState("")
const [maxMarks,setMaxMarks] = useState(100)
const [passMarks,setPassMarks] = useState(35)

useEffect(()=>{
loadSubjects()
loadMappings()
},[])

async function loadSubjects(){

const {data} = await supabase
.from("subjects")
.select("*")
.order("name")

setSubjects(data || [])

}

async function loadMappings(){

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

setClassSubjects(data || [])

}

async function addMapping(){

if(!selectedClass || !subject){
alert("Select class and subject")
return
}

await supabase
.from("class_subjects")
.insert({
class:selectedClass,
subject_id:subject,
max_marks:maxMarks,
pass_marks:passMarks
})

setSubject("")
loadMappings()

}

async function deleteMapping(id:string){

await supabase
.from("class_subjects")
.delete()
.eq("id",id)

loadMappings()

}

const grouped = classSubjects.reduce((acc:any,item:any)=>{

if(!acc[item.class]) acc[item.class] = []

acc[item.class].push(item)

return acc

},{})

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl font-semibold mb-6">
Class Subject Mapping
</h1>

{/* FORM CARD */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

<div className="flex gap-4 flex-wrap">

<select
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
className="bg-gray-800 text-white px-3 py-2 rounded border border-white/20"
>

<option value="">
Select Class
</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<select
value={subject}
onChange={(e)=>setSubject(e.target.value)}
className="bg-gray-800 text-white px-3 py-2 rounded border border-white/20"
>

<option value="">
Select Subject
</option>

{subjects.map(s=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}

</select>

<input
type="number"
value={maxMarks}
onChange={(e)=>setMaxMarks(Number(e.target.value))}
placeholder="Max Marks"
className="bg-gray-800 text-white px-3 py-2 rounded border border-white/20"
/>

<input
type="number"
value={passMarks}
onChange={(e)=>setPassMarks(Number(e.target.value))}
placeholder="Pass Marks"
className="bg-gray-800 text-white px-3 py-2 rounded border border-white/20"
/>

<button
onClick={addMapping}
className="bg-green-600 px-5 py-2 rounded"
>

Add

</button>

</div>

</div>

{/* TABLE */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6">

{Object.keys(grouped).map(cls=>(

<div key={cls} className="mb-8">

<h2 className="text-xl mb-3">
Class {cls}
</h2>

<div className="overflow-x-auto">

<table className="min-w-[600px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">
Subject
</th>

<th className="p-2 text-left">
Max
</th>

<th className="p-2 text-left">
Pass
</th>

<th className="p-2 text-left">
Action
</th>

</tr>

</thead>

<tbody>

{grouped[cls].map((row:any)=>(

<tr key={row.id} className="border-t border-white/10">

<td className="p-2">
{row.subjects?.name}
</td>

<td className="p-2">
{row.max_marks}
</td>

<td className="p-2">
{row.pass_marks}
</td>

<td className="p-2">

<button
onClick={()=>deleteMapping(row.id)}
className="bg-red-500 px-3 py-1 rounded"
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

))}

</div>

</div>

)

}