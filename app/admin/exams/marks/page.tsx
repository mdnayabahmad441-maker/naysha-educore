"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [exams,setExams]=useState<any[]>([])
const [students,setStudents]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [marks,setMarks]=useState<any>({})

const [selectedExam,setSelectedExam]=useState("")
const [selectedClass,setSelectedClass]=useState("")

useEffect(()=>{

loadExams()

},[])

async function loadExams(){

const {data}=await supabase
.from("exams")
.select("*")

setExams(data || [])

}

async function loadStudents(){

if(!selectedExam || !selectedClass){

alert("Select exam and class")
return

}

const {data:status}=await supabase
.from("exam_results_status")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)
.single()

if(status?.published){

alert("Result already published. Marks locked.")
return

}

const {data:studentsData}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(studentsData || [])

const {data:subjectData}=await supabase
.from("exam_subjects")
.select(`
subject_id,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(subjectData || [])

}

function updateMarks(studentId:string,subjectId:string,value:string){

setMarks((prev:any)=>({

...prev,
[studentId]:{

...prev[studentId],
[subjectId]:value

}

}))

}

async function saveMarks(){

if(!selectedExam){

alert("Select exam")
return

}

const {data:status}=await supabase
.from("exam_results_status")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)
.single()

if(status?.published){

alert("Result already published. Marks locked.")
return

}

for(const student of students){

for(const subject of subjects){

let value=marks?.[student.id]?.[subject.subject_id]

if(!value) continue

await supabase
.from("marks")
.upsert({

student_id:student.id,
exam_id:selectedExam,
subject_id:subject.subject_id,
marks:value

})

}

}

alert("Marks saved successfully")

}

async function createResult(){

const confirmCreate=confirm("Create result for this exam?")

if(!confirmCreate) return

await supabase
.from("exam_results_status")
.insert({

exam_id:selectedExam,
class:selectedClass,
status:"created"

})

alert("Result Created Successfully")

}

return(

<div className="p-8 text-white">

<h1 className="text-3xl mb-6">
Marks Entry
</h1>

<div className="flex gap-3 mb-6 flex-wrap">

<select
className="bg-slate-800 p-2 rounded"
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{exams.map((exam:any)=>(
<option key={exam.id} value={exam.id}>
{exam.name}
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

<th className="p-2">Student</th>

{subjects.map((s:any)=>(
<th key={s.subject_id} className="p-2">
{s.subjects.name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map((student:any)=>(

<tr key={student.id} className="border-t">

<td className="p-2">
{student.name}
</td>

{subjects.map((subject:any)=>{

const value=marks?.[student.id]?.[subject.subject_id] || ""

return(

<td key={subject.subject_id} className="p-2">

<input
value={value}
onChange={(e)=>updateMarks(student.id,subject.subject_id,e.target.value)}
className="bg-slate-800 w-20 p-1 rounded text-center"
/>

</td>

)

})}

</tr>

))}

</tbody>

</table>

</div>

<div className="mt-6 flex gap-3">

<button
onClick={saveMarks}
className="bg-green-500 px-4 py-2 rounded"
>

Save Marks

</button>

<button
onClick={createResult}
className="bg-purple-600 px-4 py-2 rounded"
>

Create Result

</button>

</div>

</div>

)

}