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
}else{
setPublished(false)
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
.select("subject,max_marks")
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
.eq("subject",subject.subject)
.single()

const key=`${student.id}_${subject.subject}`

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

function handleMark(studentId:number,subject:string,value:string){

const key=`${studentId}_${subject}`

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

const [studentId,subject]=key.split("_")

const mark=normalizeMark(marks[key])

await supabase
.from("marks")
.upsert({

exam_id:selectedExam,
class:selectedClass,
student_id:Number(studentId),
subject:subject,
marks:mark

})

}

alert("Marks saved successfully")

}

async function verifyMarks(){

if(Object.values(marks).some(m => m === "")){
alert("Fill all marks before verifying")
return
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

function handleKey(e:any){

if(e.key==="Enter"){

const form=(e.currentTarget as HTMLInputElement).form

if(!form) return

const elements=Array.from(form.elements)

const index=elements.indexOf(e.target as Element)

const next=elements[index+1] as HTMLElement

if(next) next.focus()

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

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead>

<tr className="bg-gray-700">

<th className="p-2">Student</th>

{subjects.map((s)=>(
<th key={s.subject} className="p-2">
{s.subject}
</th>
))}

</tr>

</thead>

<tbody>

{students.map((student)=>(
<tr key={student.id}>

<td className="p-2">{student.name}</td>

{subjects.map((sub)=>{

const key=`${student.id}_${sub.subject}`

return(

<td key={sub.subject} className="p-2">

<input
className="bg-gray-800 p-1 w-20 rounded"
value={marks[key]||""}
disabled={published}
onChange={(e)=>handleMark(student.id,sub.subject,e.target.value)}
onKeyDown={handleKey}
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