"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam(){

const [examName,setExamName] = useState("")
const [classes,setClasses] = useState<string[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [selectedClass,setSelectedClass] = useState("")
const [selectedSubjects,setSelectedSubjects] = useState<any>({})

useEffect(()=>{
loadClasses()
},[])

async function loadClasses(){

const {data} = await supabase
.from("students")
.select("class")

const unique = [...new Set((data||[]).map((s:any)=>s.class))]
setClasses(unique)

}

async function loadSubjects(cls:any){

setSelectedClass(cls)

const {data} = await supabase
.from("subjects")
.select("*")
.eq("class",cls)

setSubjects(data || [])

}

function toggleSubject(id:any){

setSelectedSubjects({
...selectedSubjects,
[id]: selectedSubjects[id] || {
full:100,
pass:33
}
})

}

function updateMarks(id:any,type:any,value:any){

setSelectedSubjects({
...selectedSubjects,
[id]:{
...selectedSubjects[id],
[type]:Number(value)
}
})

}

async function createExam(){

if(!examName || !selectedClass){
alert("Enter exam name and class")
return
}

const {data:exam} = await supabase
.from("exams")
.insert({
name:examName,
class:selectedClass
})
.select()
.single()

if(!exam){
alert("Exam creation failed")
return
}

for(const subjectId in selectedSubjects){

const config = selectedSubjects[subjectId]

await supabase.from("exam_subjects").insert({

exam_id:exam.id,
subject_id:subjectId,
full_marks:config.full,
pass_marks:config.pass

})

}

alert("Exam Created Successfully")

setExamName("")
setSelectedSubjects({})

}

return(

<div className="p-4 md:p-10 text-white">

<h1 className="text-2xl md:text-3xl mb-6">
Create Exam
</h1>

<div className="flex flex-col md:flex-row gap-3 mb-6">

<input
placeholder="Exam Name"
className="bg-slate-800 p-2 rounded w-full md:w-64"
value={examName}
onChange={(e)=>setExamName(e.target.value)}
/>

<select
className="bg-slate-800 p-2 rounded w-full md:w-40"
onChange={(e)=>loadSubjects(e.target.value)}
>

<option>Select Class</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={createExam}
className="bg-green-600 px-5 py-2 rounded"
>
Create Exam
</button>

</div>

<h2 className="text-xl mb-4">
Subjects
</h2>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">

<tr>
<th className="p-2">Select</th>
<th className="p-2">Subject</th>
<th className="p-2">Full Marks</th>
<th className="p-2">Pass Marks</th>
</tr>

</thead>

<tbody>

{subjects.map(sub=>{

const active = selectedSubjects[sub.id]

return(

<tr key={sub.id} className="border-t border-white/10">

<td className="p-2 text-center">

<input
type="checkbox"
onChange={()=>toggleSubject(sub.id)}
checked={!!active}
/>

</td>

<td className="p-2">
{sub.name}
</td>

<td className="p-2">

<input
type="number"
className="bg-slate-800 p-1 rounded w-20"
value={active?.full || 100}
disabled={!active}
onChange={(e)=>updateMarks(sub.id,"full",e.target.value)}
/>

</td>

<td className="p-2">

<input
type="number"
className="bg-slate-800 p-1 rounded w-20"
value={active?.pass || 33}
disabled={!active}
onChange={(e)=>updateMarks(sub.id,"pass",e.target.value)}
/>

</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

)

}