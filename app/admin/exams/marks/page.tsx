"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksEntry(){

const [exams,setExams] = useState<any[]>([])
const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [selectedExam,setSelectedExam] = useState("")
const [marks,setMarks] = useState<any>({})

useEffect(()=>{
loadExams()
},[])

async function loadExams(){

const { data } = await supabase
.from("exams")
.select("*")

setExams(data || [])

}

async function loadStudents(){

const { data:exam } = await supabase
.from("exams")
.select("*")
.eq("id",selectedExam)
.single()

const { data:studentsData } = await supabase
.from("students")
.select("*")
.eq("class",exam.class)

setStudents(studentsData || [])

const { data:subjectData } = await supabase
.from("exam_subjects")
.select(`
subjects(id,name)
`)
.eq("exam_id",selectedExam)

setSubjects(subjectData.map((s:any)=>s.subjects))

}

function handleMark(studentId:any,subjectId:any,value:any){

setMarks({
...marks,
[`${studentId}_${subjectId}`]:value
})

}

async function saveMarks(){

for(const student of students){

for(const subject of subjects){

const key = `${student.id}_${subject.id}`

const mark = marks[key]

if(mark === undefined) continue

await supabase.from("marks").insert({

student_id: student.id,
exam_id: selectedExam,
subject_id: subject.id,
marks: Number(mark)

})

}

}

alert("Marks saved")

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl mb-6">
Marks Entry
</h1>

<select
className="bg-slate-800 p-2 rounded mb-4"
value={selectedExam}
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{exams.map(e=>(
<option key={e.id} value={e.id}>
{e.name} - Class {e.class}
</option>
))}

</select>

<button
onClick={loadStudents}
className="bg-blue-500 px-4 py-2 ml-3 rounded"
>
Load Students
</button>

<table className="w-full mt-6 border border-white/20">

<thead>

<tr className="bg-white/10">

<th className="p-2">Student</th>

{subjects.map(s=>(
<th key={s.id}>{s.name}</th>
))}

</tr>

</thead>

<tbody>

{students.map(st=>(
<tr key={st.id}>

<td className="p-2">{st.name}</td>

{subjects.map(sub=>(
<td key={sub.id}>

<input
type="number"
className="bg-slate-800 w-16 p-1 rounded"
onChange={(e)=>handleMark(st.id,sub.id,e.target.value)}
/>

</td>
))}

</tr>
))}

</tbody>

</table>

<button
onClick={saveMarks}
className="bg-green-600 px-6 py-2 mt-6 rounded"
>
Save Marks
</button>

</div>

)

}