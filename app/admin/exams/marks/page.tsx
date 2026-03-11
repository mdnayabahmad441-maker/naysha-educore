"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksEntry(){

const [exams,setExams] = useState<any[]>([])
const [classes,setClasses] = useState<string[]>([])
const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])

const [selectedExam,setSelectedExam] = useState("")
const [selectedClass,setSelectedClass] = useState("")

const [marks,setMarks] = useState<any>({})

useEffect(()=>{
loadExams()
loadClasses()
},[])

async function loadExams(){

const {data} = await supabase
.from("exams")
.select("*")

setExams(data || [])

}

async function loadClasses(){

const {data} = await supabase
.from("students")
.select("class")

const unique = [...new Set((data||[]).map((s:any)=>s.class))]

setClasses(unique)

}

async function loadStudents(){

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

if(!marks[key]) continue

await supabase.from("marks").insert({

student_id:student.id,
exam_id:selectedExam,
subject_id:subject.id,
marks:Number(marks[key])

})

}

}

alert("Marks Saved Successfully")

}

return(

<div className="p-4 md:p-10 text-white">

<h1 className="text-2xl md:text-3xl mb-6">
Marks Entry
</h1>

<div className="flex flex-col md:flex-row gap-3 mb-6">

<select
className="bg-slate-800 p-2 rounded w-full md:w-auto"
value={selectedExam}
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
className="bg-slate-800 p-2 rounded w-full md:w-auto"
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={loadStudents}
className="bg-blue-500 px-4 py-2 rounded w-full md:w-auto"
>
Load Students
</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full border border-white/20 text-sm">

<thead className="bg-white/10">

<tr>

<th className="p-2 text-left">Student</th>

{subjects.map(s=>(
<th key={s.id} className="p-2 text-center">
{s.name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map(st=>(
<tr key={st.id} className="border-t border-white/10">

<td className="p-2">{st.name}</td>

{subjects.map(sub=>(
<td key={sub.id} className="p-2">

<input
type="number"
className="bg-slate-800 w-full p-1 rounded text-center"
onChange={(e)=>handleMark(st.id,sub.id,e.target.value)}
/>

</td>
))}

</tr>
))}

</tbody>

</table>

</div>

<button
onClick={saveMarks}
className="bg-green-600 px-6 py-2 mt-6 rounded"
>
Save Marks
</button>

</div>

)

}