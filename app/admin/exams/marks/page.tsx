"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const classes = [
"Nursery","LKG","UKG",
"01","02","03","04","05",
"06","07","08","09","10"
]

const [exams,setExams] = useState<any[]>([])
const [exam,setExam] = useState("")
const [className,setClassName] = useState("")

const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])

const [marks,setMarks] = useState<Record<string,string>>({})

useEffect(()=>{
loadExams()
},[])

async function loadExams(){

const {data} = await supabase
.from("exams")
.select("*")
.order("exam_date",{ascending:false})

setExams(data || [])

}

async function loadGrid(){

if(!exam || !className){
alert("Select exam and class")
return
}

const {data:studentData} = await supabase
.from("students")
.select("*")
.eq("class",className)
.order("roll_no")

setStudents(studentData || [])

const {data:subjectData} = await supabase
.from("class_subjects")
.select(`
subject_id,
subjects(name)
`)
.eq("class",className)

setSubjects(subjectData || [])

const {data:marksData} = await supabase
.from("marks")
.select("*")
.eq("exam_id",exam)
.eq("class",className)

const map:any = {}

marksData?.forEach((m:any)=>{
map[`${m.student_id}-${m.subject_id}`] = m.marks
})

setMarks(map)

}

function updateMark(studentId:string,subjectId:string,value:string){

const key = `${studentId}-${subjectId}`

setMarks(prev=>({
...prev,
[key]:value
}))

}

function total(studentId:string){

let t = 0

subjects.forEach((s:any)=>{
const v = marks[`${studentId}-${s.subject_id}`]
if(Number(v)) t += Number(v)
})

return t

}

function percent(total:number){

if(subjects.length===0) return 0

return ((total/(subjects.length*100))*100).toFixed(2)

}

async function saveMarks(){

const rows:any = []

Object.keys(marks).forEach(key=>{

const [studentId,subjectId] = key.split("-")

rows.push({
exam_id:exam,
student_id:studentId,
subject_id:subjectId,
class:className,
marks:marks[key],
status:"entered"
})

})

await supabase.from("marks").upsert(rows)

alert("Marks Saved")

}

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl font-semibold mb-6">
Marks Entry
</h1>

{/* FILTER CARD */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

<div className="flex gap-4 flex-wrap">

<select
value={exam}
onChange={(e)=>setExam(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
>
<option value="">Select Exam</option>
{exams.map(e=>(
<option key={e.id} value={e.id}>
{e.name}
</option>
))}
</select>

<select
value={className}
onChange={(e)=>setClassName(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
>
<option value="">Select Class</option>
{classes.map(c=>(
<option key={c}>{c}</option>
))}
</select>

<button
onClick={loadGrid}
className="bg-white/10 border border-white/20 px-4 py-2 rounded-lg hover:bg-white/20"
>
Load
</button>

</div>

</div>

{/* GRID */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6">

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">
Student
</th>

{subjects.map((s:any)=>(
<th key={s.subject_id} className="p-2 text-left">
{s.subjects?.name}
</th>
))}

<th className="p-2 text-left">
Total
</th>

<th className="p-2 text-left">
%
</th>

</tr>

</thead>

<tbody>

{students.map(student=>{

const t = total(student.id)

return(

<tr key={student.id} className="border-t border-white/10">

<td className="p-2">
{student.name}
</td>

{subjects.map((s:any)=>{

const key = `${student.id}-${s.subject_id}`

return(

<td key={s.subject_id} className="p-2">

<input
value={marks[key] || ""}
onChange={(e)=>updateMark(student.id,s.subject_id,e.target.value)}
className="bg-gray-800 w-20 p-1 rounded text-center"
/>

</td>

)

})}

<td className="p-2">
{t}
</td>

<td className="p-2">
{percent(t)}
</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

{/* ACTIONS */}

<div className="flex gap-4 mt-6 flex-wrap">

<button
onClick={saveMarks}
className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/20"
>
Save Marks
</button>

<button className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/20">
Verify Marks
</button>

<button className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/20">
Create Results
</button>

<button className="bg-white/10 border border-white/20 px-6 py-3 rounded-xl hover:bg-white/20">
Publish Results
</button>

</div>

</div>

)

}