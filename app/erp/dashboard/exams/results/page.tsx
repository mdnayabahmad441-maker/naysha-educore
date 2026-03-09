"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

const [schoolId,setSchoolId] = useState("")
const [sessions,setSessions] = useState<any[]>([])
const [students,setStudents] = useState<any[]>([])
const [selectedExam,setSelectedExam] = useState("")
const [results,setResults] = useState<any[]>([])

async function getSchool(){

const {data:userData} =
await supabase.auth.getUser()

const userId = userData.user?.id

const {data} =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(data){

setSchoolId(data.school_id)

loadSessions(data.school_id)
loadStudents(data.school_id)

}

}



async function loadSessions(id:string){

const {data} =
await supabase
.from("exam_sessions")
.select("*")
.eq("school_id",id)

if(data){
setSessions(data)
}

}



async function loadStudents(id:string){

const {data} =
await supabase
.from("students")
.select("*")
.eq("school_id",id)

if(data){
setStudents(data)
}

}



async function generateResults(){

if(!selectedExam){
alert("Select exam")
return
}

const {data} =
await supabase
.from("exam_marks")
.select("*")
.eq("exam_id",selectedExam)

if(!data) return

let studentMap:any = {}

data.forEach((m:any)=>{

if(!studentMap[m.student_id]){

studentMap[m.student_id] = {
total:0,
subjects:[]
}

}

studentMap[m.student_id].total += m.marks

studentMap[m.student_id].subjects.push(m)

})

let finalResults:any[] = []

students.forEach((s:any)=>{

if(studentMap[s.id]){

const total = studentMap[s.id].total
const percentage = total / studentMap[s.id].subjects.length

let grade = "C"

if(percentage >= 90) grade = "A+"
else if(percentage >= 80) grade = "A"
else if(percentage >= 70) grade = "B"
else if(percentage >= 60) grade = "C"
else grade = "D"

finalResults.push({

student:s.name,
total:total,
percentage:percentage.toFixed(2),
grade:grade,
subjects:studentMap[s.id].subjects

})

}

})

setResults(finalResults)

}



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Results
</h1>


<div className="bg-white/10 p-6 rounded-xl w-[400px] space-y-4 mb-10">

<select
className="w-full p-3 rounded bg-slate-800"
value={selectedExam}
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{sessions.map((s)=>(
<option key={s.id} value={s.id}>
{s.exam_name}
</option>
))}

</select>


<button
onClick={generateResults}
className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Generate Results

</button>

</div>



<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">
Exam Results
</h2>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left p-2">Student</th>
<th>Total</th>
<th>Percentage</th>
<th>Grade</th>
<th>Report Card</th>

</tr>

</thead>

<tbody>

{results.map((r,i)=>(

<tr key={i} className="border-b border-white/10">

<td className="p-2">{r.student}</td>
<td>{r.total}</td>
<td>{r.percentage}%</td>
<td>{r.grade}</td>

<td>

<button
onClick={()=>window.print()}
className="px-3 py-1 bg-green-600 rounded"
>

Download

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}