"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [exams,setExams] = useState<any[]>([])
const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [selectedExam,setSelectedExam] = useState("")
const [selectedClass,setSelectedClass] = useState("")
const [marks,setMarks] = useState<any>({})

useEffect(()=>{
loadExams()
},[])

async function loadExams(){

const {data} = await supabase
.from("exams")
.select("*")

setExams(data || [])

}

async function loadStudents(){

if(!selectedClass) return

const {data:studentData} = await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(studentData || [])

const {data:subjectData} = await supabase
.from("subjects")
.select("*")
.eq("class",selectedClass)

setSubjects(subjectData || [])

}

function updateMark(studentId:any,subjectId:any,value:any){

setMarks({
...marks,
[`${studentId}_${subjectId}`]:value
})

}

async function saveMarks(){

for(const student of students){

for(const subject of subjects){

let mark = marks[`${student.id}_${subject.id}`]

if(!mark || mark === ""){
mark = "ABSENT"
}

if(mark.toLowerCase?.() === "a"){
mark = "ABSENT"
}

await supabase.from("marks").upsert({

student_id:student.id,
exam_id:selectedExam,
subject_id:subject.id,
marks:mark

})

}

}

alert("Marks Saved")

}

async function createResults(){

const confirmCreate = confirm("Are you sure you want to generate results for this exam?")

if(!confirmCreate) return

const {data:studentsData} = await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

for(const student of studentsData || []){

const {data:marksData} = await supabase
.from("marks")
.select("*")
.eq("student_id",student.id)
.eq("exam_id",selectedExam)

let total = 0
let subjectsCount = 0

for(const m of marksData || []){

if(m.marks !== "ABSENT"){
total += Number(m.marks)
}

subjectsCount++

}

const percentage = subjectsCount
? (total / (subjectsCount * 100)) * 100
: 0

await supabase.from("results").upsert({

student_id:student.id,
exam_id:selectedExam,
total_marks:total,
percentage

})

}

alert("Results Generated")

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl mb-6">
Marks Entry
</h1>

<div className="flex gap-3 mb-6">

<select
className="bg-slate-800 p-2 rounded"
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{exams.map(e=>(
<option key={e.id} value={e.id}>
{e.name}
</option>
))}

</select>

<select
className="bg-slate-800 p-2 rounded"
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>

<option>01</option>
<option>02</option>
<option>03</option>

</select>

<button
onClick={loadStudents}
className="bg-blue-500 px-4 py-2 rounded"
>
Load Students
</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">

<tr>

<th className="p-2">
Student
</th>

{subjects.map(s=>(
<th key={s.id} className="p-2">
{s.name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map(student=>(

<tr key={student.id} className="border-t border-white/10">

<td className="p-2">
{student.name}
</td>

{subjects.map(sub=>(
<td key={sub.id} className="p-2">

<input
className="bg-slate-800 p-1 rounded w-16"
onChange={(e)=>updateMark(student.id,sub.id,e.target.value)}
placeholder="0"
/>

</td>
))}

</tr>

))}

</tbody>

</table>

</div>

<div className="flex gap-4 mt-6">

<button
onClick={saveMarks}
className="bg-green-600 px-6 py-2 rounded"
>
Save Marks
</button>

<button
onClick={createResults}
className="bg-purple-600 px-6 py-2 rounded"
>
Create Results
</button>

</div>

</div>

)

}