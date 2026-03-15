"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExamPage() {

const classes = [
"Nursery","LKG","UKG",
"01","02","03","04","05",
"06","07","08","09","10"
]

const [name,setName] = useState("")
const [term,setTerm] = useState("")
const [date,setDate] = useState("")

const [classMode,setClassMode] = useState("all")
const [selectedClass,setSelectedClass] = useState("")

const [subjects,setSubjects] = useState<any[]>([])
const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])

const [exams,setExams] = useState<any[]>([])

const schoolId = "1"   // replace with auth school later

useEffect(()=>{
loadExams()
},[])

useEffect(()=>{
if(classMode==="specific" && selectedClass){
loadSubjects()
}
},[selectedClass])

async function loadExams(){

const {data} = await supabase
.from("exams")
.select("*")
.order("created_at",{ascending:false})

setExams(data || [])

}

async function loadSubjects(){

const {data} = await supabase
.from("class_subjects")
.select(`
subject_id,
subjects(name)
`)
.eq("class",selectedClass)

setSubjects(data || [])

}

function toggleSubject(id:string){

if(selectedSubjects.includes(id)){

setSelectedSubjects(selectedSubjects.filter(s=>s!==id))

}else{

setSelectedSubjects([...selectedSubjects,id])

}

}

async function createExam(){

if(!name || !date){
alert("Enter exam name and date")
return
}

const examClass = classMode==="all" ? "ALL" : selectedClass

const {error} = await supabase
.from("exams")
.insert({
name,
exam_date:date,
school_id:schoolId,
class:examClass
})

if(error){

alert(error.message)
return

}

setName("")
setTerm("")
setDate("")
setSelectedSubjects([])

loadExams()

alert("Exam Created")

}

async function deleteExam(id:string){

await supabase
.from("exams")
.delete()
.eq("id",id)

loadExams()

}

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl font-semibold mb-6">
Create Exam
</h1>

{/* CREATE CARD */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

<div className="flex gap-4 flex-wrap mb-4">

<input
placeholder="Exam Name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
/>

<input
placeholder="Term"
value={term}
onChange={(e)=>setTerm(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
/>

<input
type="date"
value={date}
onChange={(e)=>setDate(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded"
/>

<button
onClick={createExam}
className="bg-white/10 border border-white/20 rounded-xl px-5 py-2 hover:bg-white/20"
>
Save Exam
</button>

</div>

{/* CLASS MODE */}

<div className="flex gap-6 mb-4">

<label className="flex items-center gap-2">

<input
type="radio"
checked={classMode==="all"}
onChange={()=>setClassMode("all")}
/>

All Classes

</label>

<label className="flex items-center gap-2">

<input
type="radio"
checked={classMode==="specific"}
onChange={()=>setClassMode("specific")}
/>

Specific Class

</label>

</div>

{/* CLASS SELECT */}

{classMode==="specific" && (

<select
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
className="bg-gray-800 px-3 py-2 rounded mb-4"
>

<option value="">
Select Class
</option>

{classes.map(c=>(
<option key={c}>
{c}
</option>
))}

</select>

)}

{/* SUBJECT SELECT */}

{subjects.length>0 && (

<div>

<h3 className="mb-2">
Select Subjects
</h3>

<div className="flex flex-wrap gap-3">

{subjects.map((s:any)=>{

const id = s.subject_id

return(

<button
key={id}
onClick={()=>toggleSubject(id)}
className={`px-3 py-1 rounded border ${
selectedSubjects.includes(id)
? "bg-blue-500"
: "bg-white/10"
}`}
>

{s.subjects?.name}

</button>

)

})}

</div>

</div>

)}

</div>

{/* EXAMS TABLE */}

<div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6">

<div className="overflow-x-auto">

<table className="min-w-[900px] w-full text-sm">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">
Exam
</th>

<th className="p-2 text-left">
Class
</th>

<th className="p-2 text-left">
Date
</th>

<th className="p-2 text-left">
Action
</th>

</tr>

</thead>

<tbody>

{exams.length===0 && (

<tr>

<td colSpan={4} className="p-4 text-center text-gray-400">

No exams created yet

</td>

</tr>

)}

{exams.map(exam=>(

<tr key={exam.id} className="border-t border-white/10">

<td className="p-2">
{exam.name}
</td>

<td className="p-2">
{exam.class}
</td>

<td className="p-2">
{exam.exam_date}
</td>

<td className="p-2">

<button
onClick={()=>deleteExam(exam.id)}
className="bg-red-500 px-3 py-1 rounded"
>

Delete

</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

</div>

)

}