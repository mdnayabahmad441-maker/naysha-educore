"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ExamsPage(){

const [schoolId,setSchoolId] = useState("")

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")

const [examName,setExamName] = useState("")
const [subject,setSubject] = useState("")
const [maxMarks,setMaxMarks] = useState(100)
const [examDate,setExamDate] = useState("")

const [exams,setExams] = useState<any[]>([])



/* GET SCHOOL */

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

loadClasses(data.school_id)
loadExams(data.school_id)

}

}



/* LOAD CLASSES */

async function loadClasses(id:string){

const {data} =
await supabase
.from("students")
.select("class")
.eq("school_id",id)

if(data){

const unique =
[...new Set(data.map((s:any)=>s.class))]

setClasses(unique)

}

}



/* LOAD EXAMS */

async function loadExams(id:string){

const {data} =
await supabase
.from("exams")
.select("*")
.eq("school_id",id)
.order("created_at",{ascending:false})

if(data){
setExams(data)
}

}



/* CREATE EXAM */

async function createExam(){

if(!selectedClass || !examName || !subject){

alert("Fill all fields")
return

}

const {error} =
await supabase
.from("exams")
.insert({

school_id:schoolId,

class:selectedClass,
exam_name:examName,
subject:subject,

max_marks:maxMarks,
exam_date:examDate

})

if(error){

alert(error.message)
return

}

alert("Exam Created")

setExamName("")
setSubject("")
setMaxMarks(100)
setExamDate("")

loadExams(schoolId)

}



/* INIT */

useEffect(()=>{
getSchool()
},[])



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Exam Management
</h1>



{/* CREATE EXAM */}

<div className="bg-white/10 p-6 rounded-xl w-[400px] space-y-4 mb-10">

<h2 className="text-xl font-bold">
Create Exam
</h2>


<select
className="w-full p-3 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>



<input
placeholder="Exam Name (Midterm / Final)"
className="w-full p-3 rounded bg-slate-800"
value={examName}
onChange={(e)=>setExamName(e.target.value)}
/>



<input
placeholder="Subject"
className="w-full p-3 rounded bg-slate-800"
value={subject}
onChange={(e)=>setSubject(e.target.value)}
/>



<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={maxMarks}
onChange={(e)=>setMaxMarks(Number(e.target.value))}
/>



<input
type="date"
className="w-full p-3 rounded bg-slate-800"
value={examDate}
onChange={(e)=>setExamDate(e.target.value)}
/>



<button
onClick={createExam}
className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Create Exam

</button>

</div>



{/* EXAMS LIST */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-6">
Exam List
</h2>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left p-2">Exam</th>
<th className="text-left p-2">Class</th>
<th className="text-left p-2">Subject</th>
<th className="text-left p-2">Max Marks</th>
<th className="text-left p-2">Date</th>

</tr>

</thead>

<tbody>

{exams.map((e)=>(

<tr key={e.id} className="border-b border-white/10">

<td className="p-2">{e.exam_name}</td>
<td>{e.class}</td>
<td>{e.subject}</td>
<td>{e.max_marks}</td>
<td>{e.exam_date}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}