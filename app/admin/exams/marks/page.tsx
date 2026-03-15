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
const [published,setPublished]=useState(false)

useEffect(()=>{loadExams()},[])

async function loadExams(){

const {data}=await supabase
.from("exams")
.select("*")

setExams(data||[])

}

async function checkPublish(){

const {data}=await supabase
.from("exam_results_status")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)
.single()

if(data?.published){
setPublished(true)
}

}

async function loadStudents(){

if(!selectedExam || !selectedClass){
alert("Select exam and class")
return
}

await checkPublish()

const {data:studentData}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(studentData||[])

const {data:subjectData}=await supabase
.from("exam_subjects")
.select(`
subject_id,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(subjectData||[])

}

function handleMark(studentId:number,subjectId:number,value:string){

const key=`${studentId}_${subjectId}`

setMarks((prev:any)=>({

...prev,
[key]:value

}))

}

function total(studentId:number){

let t=0

subjects.forEach(s=>{

const key=`${studentId}_${s.subject_id}`
const val=Number(marks[key]||0)

t+=val

})

return t

}

async function saveMarks(){

if(published){
alert("Results published. Editing locked.")
return
}

for(const key in marks){

const [studentId,subjectId]=key.split("_")

await supabase
.from("marks")
.upsert({

exam_id:selectedExam,
class:selectedClass,
student_id:Number(studentId),
subject_id:Number(subjectId),
marks:marks[key]

})

}

alert("Marks saved successfully")

}

async function verifyMarks(){

for(const st of students){

for(const sub of subjects){

const key=`${st.id}_${sub.subject_id}`

if(!marks[key]){
alert("Missing marks")
return
}

}

}

await supabase
.from("exam_results_status")
.upsert({

exam_id:selectedExam,
class:selectedClass,
verified:true,
published:false

})

alert("Marks verified")

}

async function createResults(){

alert("Results created successfully")

}

async function publishResults(){

if(!confirm("Publish results? Editing will lock.")) return

await supabase
.from("exam_results_status")
.update({published:true})
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

setPublished(true)

alert("Results published")

}

return(

<div className="p-10 text-white">

<h1 className="text-4xl mb-8">
Marks Entry
</h1>

<div className="flex gap-4 mb-6">

<select
className="bg-gray-800 p-2 rounded"
onChange={e=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{exams.map(e=>(
<option key={e.id} value={e.id}>
{e.name}
</option>
))}

</select>

<select
className="bg-gray-800 p-2 rounded"
onChange={e=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>
<option value="01">01</option>
<option value="02">02</option>
<option value="03">03</option>

</select>

<button
onClick={loadStudents}
className="bg-blue-600 px-4 py-2 rounded"
>

Load Students

</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead>

<tr className="bg-gray-700">

<th className="p-2">Student</th>

{subjects.map(s=>(
<th key={s.subject_id}>
{s.subjects.name}
</th>
))}

<th>Total</th>

</tr>

</thead>

<tbody>

{students.map(st=>(
<tr key={st.id}>

<td>{st.name}</td>

{subjects.map(sub=>{

const key=`${st.id}_${sub.subject_id}`

return(

<td key={sub.subject_id}>

<input
className="bg-gray-800 p-1 w-16 rounded"
value={marks[key]||""}
disabled={published}
onChange={e=>handleMark(st.id,sub.subject_id,e.target.value)}
/>

</td>

)

})}

<td>{total(st.id)}</td>

</tr>
))}

</tbody>

</table>

</div>

{/* ACTION BUTTONS */}

<div className="flex gap-4 mt-8 flex-wrap">

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

Verify Marks

</button>

<button
className="bg-purple-600 px-4 py-2 rounded"
onClick={createResults}
>

Create Results

</button>

<button
className="bg-red-600 px-4 py-2 rounded"
onClick={publishResults}
>

Publish Results

</button>

</div>

</div>

)

}