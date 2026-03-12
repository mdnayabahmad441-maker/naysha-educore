"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

const [status,setStatus]=useState<any>(null)
const [results,setResults]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [selectedExam,setSelectedExam]=useState("")
const [selectedClass,setSelectedClass]=useState("")
const [exams,setExams]=useState<any[]>([])

useEffect(()=>{
loadExams()
},[])

async function loadExams(){
const {data}=await supabase.from("exams").select("*")
setExams(data || [])
}

async function loadStatus(){

const {data}=await supabase
.from("exam_results_status")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)
.single()

setStatus(data)
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

loadStatus()

}

async function verifyResult(){

await supabase
.from("exam_results_status")
.update({verified:true,status:"verified"})
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

alert("Result Verified")

loadStatus()

}

async function publishResult(){

const confirmPublish=confirm("Publish result? After publishing marks cannot be edited.")

if(!confirmPublish) return

await supabase
.from("exam_results_status")
.update({
published:true,
status:"published"
})
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

alert("Result Published")

loadStatus()

}

async function loadResults(){

await loadStatus()

const {data:students}=await supabase
.from("students")
.select("*")
.eq("class",selectedClass)

const {data:examSubjects}=await supabase
.from("exam_subjects")
.select(`
subject_id,
full_marks,
subjects(name)
`)
.eq("exam_id",selectedExam)

setSubjects(examSubjects || [])

let resultRows:any[]=[]

for(const student of students || []){

const {data:marksData}=await supabase
.from("marks")
.select("*")
.eq("student_id",student.id)
.eq("exam_id",selectedExam)

let total=0
let fullTotal=0
let subjectMarks:any={}

for(const subject of examSubjects || []){

const subjectName=(subject as any)?.subjects?.name || "Subject"

fullTotal+=subject.full_marks

const markRow=marksData?.find(
(m:any)=>String(m.subject_id)===String(subject.subject_id)
)

let mark=markRow?.marks

if(!mark) mark="ABSENT"

subjectMarks[subjectName]=mark

if(mark!=="ABSENT"){
total+=Number(mark)
}

}

const percentage=(total/fullTotal)*100

resultRows.push({
student:student.name,
class:student.class,
marks:subjectMarks,
total,
percentage
})

}

resultRows.sort((a,b)=>b.percentage-a.percentage)

resultRows=resultRows.map((r,i)=>({
...r,
rank:i+1,
grade:getGrade(r.percentage)
}))

setResults(resultRows)

}

function getGrade(p:number){

if(p>=90) return "A+"
if(p>=80) return "A"
if(p>=70) return "B"
if(p>=60) return "C"
if(p>=50) return "D"
return "F"

}

function getColor(rank:number,percentage:number){

if(percentage<33) return "bg-red-500"

if(rank===1) return "bg-yellow-400 text-black"
if(rank===2) return "bg-gray-300 text-black"
if(rank===3) return "bg-orange-300 text-black"

if(percentage>=81) return "bg-green-600"
if(percentage>=61) return "bg-green-400 text-black"
if(percentage>=33) return "bg-yellow-300 text-black"

return ""

}

return(

<div className="p-8 text-white">

<h1 className="text-3xl mb-6">Exam Results</h1>

<div className="flex gap-3 mb-6 flex-wrap">

<select onChange={(e)=>setSelectedExam(e.target.value)} className="bg-slate-800 p-2 rounded">
<option>Select Exam</option>
{exams.map((e:any)=>(
<option key={e.id} value={e.id}>{e.name}</option>
))}
</select>

<select onChange={(e)=>setSelectedClass(e.target.value)} className="bg-slate-800 p-2 rounded">
<option>Select Class</option>
<option>01</option>
<option>02</option>
<option>03</option>
</select>

<button onClick={loadResults} className="bg-blue-500 px-4 py-2 rounded">
Load Results
</button>

</div>

{status?.status==="created" && (

<div className="mb-6 bg-yellow-700 p-3 rounded">
Result created. Please verify before publishing.
<button onClick={verifyResult} className="ml-4 bg-blue-500 px-3 py-1 rounded">
Verify
</button>
</div>

)}

{status?.verified && !status?.published && (

<div className="mb-6 bg-blue-700 p-3 rounded">
Result verified. Ready to publish.
<button onClick={publishResult} className="ml-4 bg-green-500 px-3 py-1 rounded">
Publish
</button>
</div>

)}

{!status && (

<button onClick={createResult} className="bg-purple-600 px-4 py-2 rounded mb-6">
Create Result
</button>

)}

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">

<tr>

<th>Rank</th>
<th>Student</th>
<th>Class</th>

{subjects.map((s:any)=>(
<th key={s.subject_id}>{s.subjects.name}</th>
))}

<th>Total</th>
<th>%</th>
<th>Grade</th>

</tr>

</thead>

<tbody>

{results.map((r:any,i:number)=>{

const rowColor=getColor(r.rank,r.percentage)

return(

<tr key={i} className={rowColor}>

<td>{r.rank}</td>
<td>{r.student}</td>
<td>{r.class}</td>

{subjects.map((s:any)=>(
<td key={s.subject_id}>
{r.marks[s.subjects.name]}
</td>
))}

<td>{r.total}</td>
<td>{r.percentage.toFixed(2)}%</td>
<td>{r.grade}</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

)

}