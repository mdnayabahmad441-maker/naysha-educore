"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [examId,setExamId] = useState("")
const [classId,setClassId] = useState("")
const [marks,setMarks] = useState<any>({})

async function loadData(){

const { data:studentData } =
await supabase
.from("students")
.select("*")
.eq("class",classId)

setStudents(studentData || [])

const { data:subjectData } =
await supabase
.from("subjects")
.select("*")
.eq("class_id",classId)

setSubjects(subjectData || [])

}

function updateMark(student:string,subject:string,value:string){

setMarks({
...marks,
[student]:{
...marks[student],
[subject]:value
}
})

}

async function saveMarks(){

for(const student in marks){

for(const subject in marks[student]){

await supabase
.from("marks")
.insert({
student_id:student,
subject_id:subject,
exam_id:examId,
marks:marks[student][subject]
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

<button
onClick={loadData}
className="mb-6 px-4 py-2 bg-cyan-600 rounded"
>
Load Students
</button>

<table className="w-full bg-white/10">

<thead>

<tr>
<th>Student</th>

{subjects.map(s=>(
<th key={s.id}>{s.name}</th>
))}

</tr>

</thead>

<tbody>

{students.map(student=>(

<tr key={student.id}>

<td>{student.name}</td>

{subjects.map(subject=>(

<td key={subject.id}>

<input
type="number"
className="w-20 bg-slate-800"
onChange={(e)=>
updateMark(student.id,subject.id,e.target.value)
}
/>

</td>

))}

</tr>

))}

</tbody>

</table>

<button
onClick={saveMarks}
className="mt-6 px-6 py-2 bg-green-600 rounded"
>
Save Marks
</button>

</div>

)

}