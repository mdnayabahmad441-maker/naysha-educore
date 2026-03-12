"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam(){

const [examName,setExamName] = useState("")
const [selectedClass,setSelectedClass] = useState("")
const [classes,setClasses] = useState<string[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [selectedSubjects,setSelectedSubjects] = useState<any>({})
const [schedule,setSchedule] = useState<any>({})
const [exams,setExams] = useState<any[]>([])
const [editingExam,setEditingExam] = useState<string | null>(null)

useEffect(()=>{
loadClasses()
loadExams()
},[])

async function loadClasses(){

const {data} = await supabase
.from("students")
.select("class")

const unique=[...new Set((data||[]).map((s:any)=>s.class))]
setClasses(unique)

}

async function loadSubjects(cls:string){

setSelectedClass(cls)

const {data} = await supabase
.from("subjects")
.select("*")
.eq("class",cls)

setSubjects(data || [])

}

async function loadExams(){

const {data} = await supabase
.from("exams")
.select("*")
.order("created_at",{ascending:false})

setExams(data || [])

}

function toggleSubject(id:string){

if(selectedSubjects[id]){

const copy={...selectedSubjects}
delete copy[id]
setSelectedSubjects(copy)

}else{

setSelectedSubjects({
...selectedSubjects,
[id]:{
full:100,
pass:33
}
})

}

}

function updateFullMarks(id:string,value:any){

const full=Number(value)
const pass=Math.round(full*0.33)

setSelectedSubjects({
...selectedSubjects,
[id]:{
full,
pass
}
})

}

function updateSchedule(subjectId:string,date:string){

setSchedule({
...schedule,
[subjectId]:date
})

}

function resetForm(){

setExamName("")
setSelectedClass("")
setSelectedSubjects({})
setSchedule({})
setEditingExam(null)

}

async function createExam(){

if(!examName || !selectedClass){
alert("Enter exam name and class")
return
}

const {data:exam,error}=await supabase
.from("exams")
.insert({
name:examName,
class:selectedClass
})
.select()
.single()

if(error){
alert("Exam creation failed")
return
}

for(const subjectId in selectedSubjects){

const config=selectedSubjects[subjectId]

await supabase.from("exam_subjects").insert({
exam_id:exam.id,
subject_id:subjectId,
full_marks:config.full,
pass_marks:config.pass
})

await supabase.from("exam_schedule").insert({
exam_id:exam.id,
subject_id:subjectId,
exam_date:schedule[subjectId] || null
})

}

alert("Exam Created")

resetForm()
loadExams()

}

async function updateExam(){

if(!editingExam) return

await supabase
.from("exams")
.update({
name:examName,
class:selectedClass
})
.eq("id",editingExam)

await supabase
.from("exam_subjects")
.delete()
.eq("exam_id",editingExam)

await supabase
.from("exam_schedule")
.delete()
.eq("exam_id",editingExam)

for(const subjectId in selectedSubjects){

const config=selectedSubjects[subjectId]

await supabase.from("exam_subjects").insert({
exam_id:editingExam,
subject_id:subjectId,
full_marks:config.full,
pass_marks:config.pass
})

await supabase.from("exam_schedule").insert({
exam_id:editingExam,
subject_id:subjectId,
exam_date:schedule[subjectId] || null
})

}

alert("Exam Updated")

resetForm()
loadExams()

}

async function deleteExam(id:string){

const confirmDelete=confirm("Are you sure you want to delete this exam?")

if(!confirmDelete) return

await supabase
.from("exam_subjects")
.delete()
.eq("exam_id",id)

await supabase
.from("exam_schedule")
.delete()
.eq("exam_id",id)

await supabase
.from("exams")
.delete()
.eq("id",id)

loadExams()

}

function editExam(exam:any){

setExamName(exam.name)
setSelectedClass(exam.class)
setEditingExam(exam.id)

loadSubjects(exam.class)

}

return(

<div className="p-4 md:p-10 text-white">

<h1 className="text-3xl mb-6">
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
value={selectedClass}
onChange={(e)=>loadSubjects(e.target.value)}
>
<option value="">Select Class</option>
{classes.map(c=>(
<option key={c}>{c}</option>
))}
</select>

{editingExam ? (

<button
onClick={updateExam}
className="bg-yellow-500 px-5 py-2 rounded"
>
Save Changes
</button>

) : (

<button
onClick={createExam}
className="bg-green-600 px-5 py-2 rounded"
>
Create Exam
</button>

)}

</div>

<h2 className="text-xl mb-4">
Subjects & Schedule
</h2>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">
<tr>
<th className="p-2">Select</th>
<th className="p-2">Subject</th>
<th className="p-2">Full Marks</th>
<th className="p-2">Pass Marks</th>
<th className="p-2">Exam Date</th>
</tr>
</thead>

<tbody>

{subjects.map(sub=>{

const active=selectedSubjects[sub.id]

return(

<tr key={sub.id} className="border-t border-white/10">

<td className="p-2 text-center">
<input
type="checkbox"
checked={!!active}
onChange={()=>toggleSubject(sub.id)}
/>
</td>

<td className="p-2">
{sub.name}
</td>

<td className="p-2">
<input
type="number"
className="bg-slate-800 p-1 rounded w-20"
disabled={!active}
value={active?.full || ""}
onChange={(e)=>updateFullMarks(sub.id,e.target.value)}
/>
</td>

<td className="p-2">
<input
type="number"
className="bg-slate-800 p-1 rounded w-20"
disabled
value={active?.pass || ""}
/>
</td>

<td className="p-2">
<input
type="date"
className="bg-slate-800 p-1 rounded"
disabled={!active}
value={schedule[sub.id] || ""}
onChange={(e)=>updateSchedule(sub.id,e.target.value)}
/>
</td>

</tr>

)

})}

</tbody>

</table>

</div>

<h2 className="text-xl mt-10 mb-4">
Existing Exams
</h2>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">
<tr>
<th className="p-2">Exam</th>
<th className="p-2">Class</th>
<th className="p-2">Actions</th>
</tr>
</thead>

<tbody>

{exams.map(e=>(

<tr key={e.id} className="border-t border-white/10">

<td className="p-2">{e.name}</td>
<td className="p-2">{e.class}</td>

<td className="p-2 flex gap-2">

<button
onClick={()=>editExam(e)}
className="bg-yellow-500 px-3 py-1 rounded"
>
Edit
</button>

<button
onClick={()=>deleteExam(e.id)}
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