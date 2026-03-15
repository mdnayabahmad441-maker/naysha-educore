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

useEffect(()=>{
loadExams()
},[])

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

loadExistingMarks(studentData,subjectData)

}

async function loadExistingMarks(studentData:any,subjectData:any){

let newMarks:any={}

for(const student of studentData){

for(const subject of subjectData){

const {data}=await supabase
.from("marks")
.select("*")
.eq("exam_id",selectedExam)
.eq("student_id",student.id)
.eq("subject_id",subject.subject_id)
.single()

const key=`${student.id}_${subject.subject_id}`

newMarks[key]=data?.marks || ""

}

}

setMarks(newMarks)

}

function normalizeMark(value:string){

if(!value || value===""){
return "ABSENT"
}

if(value.toUpperCase()==="A"){
return "ABSENT"
}

return value

}

function handleMark(studentId:number,subjectId:number,value:string){

const key=`${studentId}_${subjectId}`

setMarks((prev:any)=>({

...prev,
[key]:value

}))

}

async function saveMarks(){

if(published){
alert("Results already published. Editing locked.")
return
}

for(const key in marks){

const [studentId,subjectId]=key.split("_")

const mark=normalizeMark(marks[key])

await supabase
.from("marks")
.upsert({

exam_id:selectedExam,
class:selectedClass,
student_id:Number(studentId),
subject_id:Number(subjectId),
marks:mark

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
verified:true,
published:false

})

alert("Marks verified")

}

async function createResults(){

if(!confirm("Create results now?")) return

alert("Results created. Go to results page.")

}

async function publishResults(){

if(!confirm("Publish results? This locks marks.")) return

await supabase
.from("exam_results_status")
.update({
published:true
})
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

setPublished(true)

alert("Results published")

}

function handleKeyNavigation(e:any){

const input=e.target as HTMLInputElement

const cell=input.parentElement
const row=cell?.parentElement

if(!cell || !row) return

if(e.key==="Enter"){
e.preventDefault()

const next=row.nextElementSibling
const index=Array.from(row.children).indexOf(cell)

const nextCell=next?.children[index]
const nextInput=nextCell?.querySelector("input") as HTMLElement

if(nextInput) nextInput.focus()
}

if(e.key==="ArrowRight"){

const nextCell=cell.nextElementSibling
const nextInput=nextCell?.querySelector("input") as HTMLElement
if(nextInput) nextInput.focus()

}

if(e.key==="ArrowLeft"){

const prevCell=cell.previousElementSibling
const prevInput=prevCell?.querySelector("input") as HTMLElement
if(prevInput) prevInput.focus()

}

if(e.key==="ArrowDown"){

const nextRow=row.nextElementSibling
const index=Array.from(row.children).indexOf(cell)

const nextCell=nextRow?.children[index]
const nextInput=nextCell?.querySelector("input") as HTMLElement

if(nextInput) nextInput.focus()

}

if(e.key==="ArrowUp"){

const prevRow=row.previousElementSibling
const index=Array.from(row.children).indexOf(cell)

const prevCell=prevRow?.children[index]
const prevInput=prevCell?.querySelector("input") as HTMLElement

if(prevInput) prevInput.focus()

}

}

return(

<div className="p-10 text-white">

<h1 className="text-4xl font-bold mb-10">

Result Creation

</h1>

<div className="flex gap-4 mb-6 flex-wrap">

<select
className="bg-gray-800 p-2 rounded"
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{exams.map((exam)=>(
<option key={exam.id} value={exam.id}>
{exam.name}
</option>
))}

</select>

<select
className="bg-gray-800 p-2 rounded"
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>
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

<div className="overflow-x-auto border border-gray-700 rounded-lg">

<table className="min-w-full text-sm border-collapse">

<thead>

<tr className="bg-gray-700">

<th className="p-3 sticky left-0 bg-gray-700 z-10">
Student
</th>

{subjects.map((s)=>(
<th key={s.subject_id} className="p-3 min-w-[90px]">
{s.subjects.name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map((student)=>(
<tr key={student.id} className="border-b border-gray-800">

<td className="p-2 sticky left-0 bg-gray-900 font-medium">
{student.name}
</td>

{subjects.map((sub)=>{

const key=`${student.id}_${sub.subject_id}`

return(

<td key={sub.subject_id} className="p-2 text-center">

<input
className="bg-gray-800 p-2 w-16 text-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
value={marks[key]||""}
disabled={published}
onChange={(e)=>handleMark(student.id,sub.subject_id,e.target.value)}
onKeyDown={(e)=>handleKeyNavigation(e)}
/>

</td>

)

})}

</tr>
))}

</tbody>

</table>

</div>

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

Verify

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