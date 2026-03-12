"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

const [exams,setExams]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])
const [results,setResults]=useState<any[]>([])
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

async function loadResults(){

if(!selectedExam || !selectedClass){

alert("Select exam and class")
return

}

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
let totalFullMarks=0
let subjectMarks:any={}

for(const subject of examSubjects || []){

totalFullMarks += subject.full_marks

const subjectName =
(subject as any)?.subjects?.name || "Subject"

const markRow = marksData?.find(
(m:any)=>String(m.subject_id) === String(subject.subject_id)
)

let mark = markRow?.marks

if(mark === null || mark === undefined || mark === ""){
mark="ABSENT"
}

subjectMarks[subjectName] = mark

if(mark !== "ABSENT"){
total += Number(mark)
}

}

const percentage = totalFullMarks
? (total/totalFullMarks)*100
:0

resultRows.push({

student:student.name,
class:student.class,
marks:subjectMarks,
total,
percentage

})

}

resultRows.sort((a:any,b:any)=>b.percentage-a.percentage)

let rank=1

resultRows=resultRows.map((r:any,i:number)=>{

if(i>0 && r.percentage < resultRows[i-1].percentage){

rank=i+1

}

return{

...r,
rank

}

})

setResults(resultRows)

}

function getRowColor(rank:number,percentage:number){

if(percentage < 33) return "bg-red-500"

if(rank===1) return "bg-yellow-400 text-black"

if(rank===2) return "bg-gray-300 text-black"

if(rank===3) return "bg-orange-300 text-black"

if(percentage>=81) return "bg-green-600"

if(percentage>=61) return "bg-green-400 text-black"

if(percentage>=33) return "bg-yellow-300 text-black"

return ""

}

return(

<div className="p-6 text-white">

<h1 className="text-3xl mb-6">
Exam Results
</h1>

<div className="flex gap-3 flex-wrap mb-6">

<select
className="bg-slate-800 p-2 rounded"
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option value="">Select Exam</option>

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

<option value="">Select Class</option>

<option>01</option>
<option>02</option>
<option>03</option>

</select>

<button
onClick={loadResults}
className="bg-blue-500 px-4 py-2 rounded"
>

Load Results

</button>

</div>

<div className="overflow-x-auto">

<table className="min-w-full text-sm">

<thead className="bg-white/10">

<tr>

<th className="p-2">Rank</th>
<th className="p-2">Student</th>
<th className="p-2">Class</th>

{subjects.map((s:any)=>{

const subjectName = s?.subjects?.name || "Subject"

return(

<th key={s.subject_id} className="p-2">
{subjectName}
</th>

)

})}

<th className="p-2">Total</th>
<th className="p-2">%</th>

</tr>

</thead>

<tbody>

{results.map((r:any,index:number)=>{

const rowColor=getRowColor(r.rank,r.percentage)

return(

<tr key={index} className={`${rowColor} border-t`}>

<td className="p-2">{r.rank}</td>
<td className="p-2">{r.student}</td>
<td className="p-2">{r.class}</td>

{subjects.map((s:any)=>{

const subjectName=s?.subjects?.name || "Subject"

return(

<td key={s.subject_id} className="p-2 text-center">
{r.marks[subjectName]}
</td>

)

})}

<td className="p-2">{r.total}</td>

<td className="p-2">
{r.percentage.toFixed(2)}%
</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

)

}