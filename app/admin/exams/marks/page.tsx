"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [exams,setExams]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [students,setStudents]=useState<any[]>([])
const [marks,setMarks]=useState<any>({})

const [selectedExam,setSelectedExam]=useState("")
const [selectedClass,setSelectedClass]=useState("")
const [published,setPublished]=useState(false)

useEffect(()=>{
loadExams()
},[])

async function loadExams(){

const {data}=await supabase
.from("exams")
.select("*")

setExams(data||[])

}

async function loadStudents(){

if(!selectedExam || !selectedClass){
alert("Select exam and class")
return
}

const {data:studentsData}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(studentsData||[])

const {data:subjectData}=await supabase
.from("exam_subjects")
.select("*")
.eq("exam_id",selectedExam)

setSubjects(subjectData||[])

const {data:status}=await supabase
.from("exam_results_status")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)
.single()

if(status?.published){
setPublished(true)
}else{
setPublished(false)
}

}

function handleMark(studentId:any,subjectId:any,value:any){

setMarks((prev:any)=>({
...prev,
[`${studentId}_${subjectId}`]:value
}))

}

async function saveMarks(){

if(published){
alert("Result already published. Marks locked.")
return
}

for(const key in marks){

const [student,subject]=key.split("_")

await supabase
.from("marks")
.upsert({
exam_id:selectedExam,
class:selectedClass,
student_id:student,
subject_id:subject,
marks:marks[key]
})

}

alert("Marks saved successfully")

}

async function verifyMarks(){

await supabase
.from("exam_results_status")
.upsert({
exam_id:selectedExam,
class:selectedClass,
verified:true
})

alert("Marks verified")

}

async function createResult(){

const confirmCreate=confirm("Create results now?")

if(!confirmCreate)return

await supabase
.from("exam_results_status")
.upsert({
exam_id:selectedExam,
class:selectedClass,
results_created:true
})

alert("Results created")

}

async function publishResult(){

const confirmPublish=confirm("Publish results? This will lock marks.")

if(!confirmPublish)return

await supabase
.from("exam_results_status")
.update({
published:true,
published_at:new Date()
})
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

setPublished(true)

alert("Results published successfully")

}

return(

<div className="p-8 text-white">

<h1 className="text-3xl font-bold mb-6">
Result Creation
</h1>

<div className="flex flex-wrap gap-4 mb-6">

<select
className="bg-gray-800 p-2"
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option value="">Select Exam</option>

{exams.map((exam)=>(
<option key={exam.id} value={exam.id}>
{exam.name}
</option>
))}

</select>

<select
className="bg-gray-800 p-2"
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option value="">Select Class</option>
<option value="01">01</option>
<option value="02">02</option>
<option value="03">03</option>

</select>

<button
className="bg-blue-600 px-4 py-2 rounded"
onClick={loadStudents}
>
Load Students
</button>

</div>

<div className="overflow-auto">

<table className="min-w-full text-sm">

<thead>

<tr className="bg-gray-700">

<th className="p-2 text-left">
Student
</th>

{subjects.map((subject)=>(
<th key={subject.id} className="p-2">
{subject.subject_name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map((student)=>(
<tr key={student.id} className="border-b">

<td className="p-2">
{student.name}
</td>

{subjects.map((subject)=>(
<td key={subject.id} className="p-2">

<input
type="text"
placeholder="0 / A"
disabled={published}
className="bg-gray-800 p-1 w-16 text-center"
onChange={(e)=>
handleMark(
student.id,
subject.id,
e.target.value
)
}

onKeyDown={(e)=>{

if(e.key==="Enter"){

const form=e.currentTarget.form
const index=Array.prototype.indexOf.call(form,e.target)
form.elements[index+1]?.focus()

}

}}

 />

</td>
))}

</tr>
))}

</tbody>

</table>

</div>

<div className="flex gap-4 mt-6 flex-wrap">

<button
className="bg-green-600 px-4 py-2 rounded"
onClick={saveMarks}
>
Save Marks
</button>

<button
className="bg-yellow-500 px-4 py-2 rounded"
onClick={verifyMarks}
>
Verify
</button>

<button
className="bg-indigo-600 px-4 py-2 rounded"
onClick={createResult}
>
Create Result
</button>

<button
className="bg-purple-600 px-4 py-2 rounded"
onClick={publishResult}
>
Publish Result
</button>

</div>

</div>

)

}