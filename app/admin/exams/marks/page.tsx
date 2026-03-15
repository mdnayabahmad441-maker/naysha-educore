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

const [loading,setLoading]=useState(false)

useEffect(()=>{
loadExams()
},[])

async function loadExams(){

const {data}=await supabase
.from("exams")
.select("*")
.order("created_at",{ascending:false})

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

setLoading(true)

await checkPublish()

/* load students */

const {data:studentData}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)
.order("roll_number")

setStudents(studentData||[])

/* load subjects */

const {data:subjectData}=await supabase
.from("exam_subjects")
.select(`
subject_id,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(subjectData||[])

/* load existing marks */

await loadExistingMarks(studentData||[],subjectData||[])

setLoading(false)

}

async function loadExistingMarks(studentData:any,subjectData:any){

let newMarks:any={}

/* get all marks at once */

const {data:marksData}=await supabase
.from("marks")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

for(const student of studentData){

for(const subject of subjectData){

const key=`${student.id}_${subject.subject_id}`

const found=marksData?.find(
(m:any)=>
m.student_id===student.id &&
m.subject_id===subject.subject_id
)

newMarks[key]=found?.marks || ""

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

{/* SELECT AREA */}

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

{/* LOADING */}

{loading && (
<p className="text-gray-400 mb-6">
Loading students and subjects...
</p>
)}

{/* MARKS TABLE */}

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead>

<tr className="bg-gray-700">

<th className="p-3 text-left">
Student
</th>

{subjects.map((s)=>(
<th key={s.subject_id} className="p-3">
{s.subjects.name}
</th>
))}

</tr>

</thead>

<tbody>

{students.map((student)=>(
<tr key={student.id} className="border-b border-gray-800">

<td className="p-2">
{student.name}
</td>

{subjects.map((sub)=>{

const key=`${student.id}_${sub.subject_id}`

return(

<td key={sub.subject_id} className="p-2">

<input
type="text"
placeholder="0"
className="bg-gray-800 p-1 w-20 rounded text-center"
value={marks[key]||""}
disabled={published}
onChange={(e)=>handleMark(student.id,sub.subject_id,e.target.value)}
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