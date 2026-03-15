"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

type Student = {
  id:number
  name:string
  class:string
}

type Subject = {
  subject_id:number
  full_marks:number
  subjects:{ name:string }[]
}

export default function MarksPage(){

const [exams,setExams]=useState<any[]>([])
const [students,setStudents]=useState<Student[]>([])
const [subjects,setSubjects]=useState<Subject[]>([])
const [marks,setMarks]=useState<Record<string,string>>({})
const [selectedExam,setSelectedExam]=useState("")
const [selectedClass,setSelectedClass]=useState("")
const [published,setPublished]=useState(false)

const cellRefs = useRef<Record<string,HTMLInputElement|null>>({})

useEffect(()=>{ loadExams() },[])

async function loadExams(){
const {data}=await supabase.from("exams").select("*")
setExams(data||[])
}

async function loadStudents(){

if(!selectedExam || !selectedClass){
alert("Select exam and class")
return
}

const {data:studentData}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

setStudents(studentData||[])

const {data:subjectData}=await supabase
.from("exam_subjects")
.select(`
subject_id,
full_marks,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(subjectData||[])

}

function key(student:number,subject:number){
return `${student}_${subject}`
}

function handleChange(student:number,subject:number,value:string){

if(published) return

let v=value.trim()

if(v.toUpperCase()==="A") v="ABSENT"
if(v.toUpperCase()==="L") v="LEAVE"

setMarks(prev=>({...prev,[key(student,subject)]:v}))
}

function handleKey(e:React.KeyboardEvent,studentIndex:number,subjectIndex:number){

let nextStudent=studentIndex
let nextSubject=subjectIndex

if(e.key==="ArrowRight") nextSubject++
if(e.key==="ArrowLeft") nextSubject--
if(e.key==="ArrowDown"||e.key==="Enter") nextStudent++
if(e.key==="ArrowUp") nextStudent--
if(e.key==="Tab") nextSubject++

const s=students[nextStudent]
const sub=subjects[nextSubject]

if(s && sub){
e.preventDefault()
const ref=cellRefs.current[key(s.id,sub.subject_id)]
ref?.focus()
}

}

function handlePaste(e:React.ClipboardEvent,studentIndex:number,subjectIndex:number){

const text=e.clipboardData.getData("text")
if(!text) return

e.preventDefault()

const rows=text.split("\n")

rows.forEach((row,r)=>{

const cells=row.split(/\t|,/)

cells.forEach((cell,c)=>{

const s=students[studentIndex+r]
const sub=subjects[subjectIndex+c]

if(!s||!sub) return

handleChange(s.id,sub.subject_id,cell)

})

})

}

function calculateTotal(studentId:number){

let total=0

subjects.forEach(sub=>{

const v=marks[key(studentId,sub.subject_id)]

if(v && !isNaN(Number(v))){
total+=Number(v)
}

})

return total
}

function calculatePercentage(studentId:number){

const total=calculateTotal(studentId)

const max=subjects.reduce((sum,s)=>sum+Number(s.full_marks||0),0)

if(max===0) return 0

return ((total/max)*100).toFixed(1)
}

function isInvalid(student:number,subject:number){

const v=marks[key(student,subject)]
if(!v) return false
if(v==="ABSENT"||v==="LEAVE") return false

const sub=subjects.find(s=>s.subject_id===subject)
if(!sub) return false

return Number(v)>Number(sub.full_marks)
}

async function saveMarks(){

for(const k in marks){

const [student,subject]=k.split("_")

await supabase
.from("marks")
.upsert({
exam_id:selectedExam,
class:selectedClass,
student_id:Number(student),
subject_id:Number(subject),
marks:marks[k]
})

}

alert("Marks saved")
}

async function verifyMarks(){

for(const s of students){
for(const sub of subjects){

const v=marks[key(s.id,sub.subject_id)]

if(!v){
alert(`Missing marks for ${s.name}`)
return
}

}
}

await supabase.from("exam_results_status").upsert({
exam_id:selectedExam,
class:selectedClass,
verified:true
})

alert("Marks verified")
}

async function createResults(){

alert("Results will be calculated in results page")

}

async function publishResults(){

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

<h1 className="text-4xl font-bold mb-6">
Marks Entry
</h1>

<div className="flex gap-4 mb-6">

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

<table className="border border-gray-700">

<thead>

<tr className="bg-gray-800">

<th className="p-2 border">Student</th>

{subjects.map(s=>(

<th key={s.subject_id} className="p-2 border">
{s.subjects?.[0]?.name}
</th>

))}

<th className="p-2 border">Total</th>
<th className="p-2 border">%</th>

</tr>

</thead>

<tbody>

{students.map((student,si)=>(

<tr key={student.id}>

<td className="p-2 border">
{student.name}
</td>

{subjects.map((sub,subi)=>{

const k=key(student.id,sub.subject_id)

return(

<td key={sub.subject_id} className="border">

<input

ref={(el) => {
  cellRefs.current[k] = el
}}

className={`w-20 bg-gray-900 p-1 text-center outline-none
${isInvalid(student.id,sub.subject_id)?"border-red-500 border":""}
`}

value={marks[k]||""}

disabled={published}

onChange={(e)=>handleChange(student.id,sub.subject_id,e.target.value)}

onKeyDown={(e)=>handleKey(e,si,subi)}

onPaste={(e)=>handlePaste(e,si,subi)}

/>

</td>

)

})}

<td className="p-2 border text-center">
{calculateTotal(student.id)}
</td>

<td className="p-2 border text-center">
{calculatePercentage(student.id)}%
</td>

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