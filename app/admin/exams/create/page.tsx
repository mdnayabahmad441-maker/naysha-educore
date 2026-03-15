"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const classes = [
"Nursery","LKG","UKG",
"01","02","03","04","05","06","07","08","09","10"
]

const [exams,setExams] = useState<any[]>([])
const [selectedExam,setSelectedExam] = useState("")
const [selectedClass,setSelectedClass] = useState("")

const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])

const [marks,setMarks] = useState<Record<string,string>>({})

const inputRefs = useRef<any>({})

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

if(!selectedExam || !selectedClass){
alert("Select exam and class")
return
}

const {data:studentsData} = await supabase
.from("students")
.select("*")
.eq("class",selectedClass)
.order("roll_no")

setStudents(studentsData || [])

const {data:subjectsData} = await supabase
.from("class_subjects")
.select(`
subject_id,
max_marks,
pass_marks,
subjects(name)
`)
.eq("class",selectedClass)

setSubjects(subjectsData || [])

const {data:marksData} = await supabase
.from("marks")
.select("*")
.eq("exam_id",selectedExam)
.eq("class",selectedClass)

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
const val = marks[`${studentId}-${s.subject_id}`]
if(Number(val)) t += Number(val)
})

return t

}

function percentage(total:number){

if(subjects.length===0) return 0

return ((total/(subjects.length*100))*100).toFixed(2)

}

function handleKey(e:any,row:number,col:number){

if(e.key==="ArrowRight"){
focusCell(row,col+1)
}

if(e.key==="ArrowLeft"){
focusCell(row,col-1)
}

if(e.key==="ArrowDown"){
focusCell(row+1,col)
}

if(e.key==="ArrowUp"){
focusCell(row-1,col)
}

if(e.key==="Enter"){
focusCell(row+1,col)
}

}

function focusCell(r:number,c:number){

const key = `${r}-${c}`

if(inputRefs.current[key]){
inputRefs.current[key].focus()
}

}

function handlePaste(e:any,row:number,col:number){

const paste = e.clipboardData.getData("text")

const rows = paste.split("\n")

rows.forEach((r,rowIndex)=>{

const cols = r.split(/\t|,/)

cols.forEach((cell,colIndex)=>{

const student = students[row + rowIndex]
const subject = subjects[col + colIndex]

if(student && subject){

const key = `${student.id}-${subject.subject_id}`

marks[key] = cell

}

})

})

setMarks({...marks})

}

async function saveMarks(){

const rows:any = []

Object.keys(marks).forEach(key=>{

const [studentId,subjectId] = key.split("-")

rows.push({
exam_id:selectedExam,
student_id:studentId,
subject_id:subjectId,
class:selectedClass,
marks:marks[key],
status:"entered"
})

})

await supabase.from("marks").upsert(rows)

alert("Marks saved")

}

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6 font-semibold">
Marks Entry
</h1>

{/* FILTER CARD */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

<div className="flex gap-4 flex-wrap">

<select
value={selectedExam}
onChange={(e)=>setSelectedExam(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
>

<option value="">Select Exam</option>

{exams.map(exam=>(
<option key={exam.id} value={exam.id}>
{exam.name}
</option>
))}

</select>

<select
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
>

<option value="">Select Class</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={loadGrid}
className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 hover:bg-white/20"
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

<th className="p-2 text-left">Student</th>

{subjects.map((s:any)=>(
<th key={s.subject_id} className="p-2">
{s.subjects?.name}
</th>
))}

<th className="p-2">Total</th>
<th className="p-2">%</th>

</tr>

</thead>

<tbody>

{students.map((student,row)=>{

const t = total(student.id)

return(

<tr key={student.id} className="border-t border-white/10">

<td className="p-2">
{student.name}
</td>

{subjects.map((s:any,col)=>{

const key = `${student.id}-${s.subject_id}`

return(

<td key={s.subject_id} className="p-2">

<input
ref={el=>inputRefs.current[`${row}-${col}`]=el}
value={marks[key] || ""}
onChange={(e)=>updateMark(student.id,s.subject_id,e.target.value)}
onKeyDown={(e)=>handleKey(e,row,col)}
onPaste={(e)=>handlePaste(e,row,col)}
className="bg-gray-800 w-20 p-1 rounded text-center focus:ring-2 focus:ring-blue-500"
/>

</td>

)

})}

<td className="p-2">{t}</td>

<td className="p-2">
{percentage(t)}
</td>

</tr>

)

})}

</tbody>

</table>

</div>

</div>

{/* ACTION BUTTONS */}

<div className="flex gap-4 mt-6 flex-wrap">

<button
onClick={saveMarks}
className="bg-white/10 border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20"
>
Save Marks
</button>

<button className="bg-white/10 border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20">
Verify Marks
</button>

<button className="bg-white/10 border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20">
Create Results
</button>

<button className="bg-white/10 border border-white/20 rounded-xl px-6 py-3 hover:bg-white/20">
Publish Results
</button>

</div>

</div>

)

}