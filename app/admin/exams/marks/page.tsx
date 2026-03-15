"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const selectedExam="1"
const selectedClass="1"

const [students,setStudents]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [marks,setMarks]=useState<any[]>([])

useEffect(()=>{

async function load(){

const {data:st} = await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(st || [])

const {data:sub} = await supabase
.from("exam_subjects")
.select(`
subject_id,
full_marks,
pass_marks,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(sub || [])

const {data:mk} = await supabase
.from("marks")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

setMarks(mk || [])

}

load()

},[])

const markMap:Record<string,any>={}

marks.forEach(m=>{
markMap[`${m.student_id}-${m.subject_id}`]=m
})

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6">Marks Entry</h1>

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">Student</th>

{subjects.map((s:any)=>(
<th key={s.subject_id} className="p-2 text-left">
{s.subjects?.name}
</th>
))}

<th className="p-2 text-left">Total</th>
<th className="p-2 text-left">%</th>

</tr>

</thead>

<tbody>

{students.map(student=>{

let total=0

return(

<tr key={student.id}>

<td className="p-2">{student.name}</td>

{subjects.map((s:any)=>{

const key=`${student.id}-${s.subject_id}`

const value=markMap[key]?.marks || ""

if(Number(value)) total+=Number(value)

return(

<td key={s.subject_id} className="p-2">

<input
defaultValue={value}
className="bg-gray-800 w-20 p-1 rounded text-center focus:ring-2 focus:ring-blue-500"
/>

</td>

)

})}

<td className="p-2">{total}</td>
<td className="p-2">
{subjects.length ? ((total/(subjects.length*100))*100).toFixed(2) : 0}
</td>

</tr>

)

})}

</tbody>

</table>

</div>

<div className="flex gap-4 mt-6 flex-wrap">

<button className="bg-green-600 px-4 py-2 rounded">Save</button>
<button className="bg-yellow-500 px-4 py-2 rounded">Verify</button>
<button className="bg-purple-600 px-4 py-2 rounded">Create Results</button>
<button className="bg-red-600 px-4 py-2 rounded">Publish</button>

</div>

</div>

)

}