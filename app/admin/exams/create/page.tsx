"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam(){

const [schoolId,setSchoolId] = useState("")
const [examName,setExamName] = useState("")
const [selectedClass,setSelectedClass] = useState("")
const [classes,setClasses] = useState<string[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])
const [createAll,setCreateAll] = useState(false)

useEffect(()=>{
loadSchool()
},[])

async function loadSchool(){

const { data } = await supabase.auth.getSession()

const userId = data.session?.user.id

const { data:user } = await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(user){

setSchoolId(user.school_id)

loadClasses(user.school_id)

}

}

async function loadClasses(school:string){

const { data } = await supabase
.from("students")
.select("class")
.eq("school_id",school)

const unique = [...new Set(data?.map((s:any)=>s.class))]

setClasses(unique as string[])

}

async function loadSubjects(className:string){

const { data } = await supabase
.from("subjects")
.select("*")
.eq("class",className)

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

if(!examName){
alert("Enter exam name")
return
}

if(createAll){

for(const className of classes){

const { data:exam } = await supabase
.from("exams")
.insert({
name: examName,
class: className,
school_id: schoolId
})
.select()
.single()

const { data:sub } = await supabase
.from("subjects")
.select("*")
.eq("class",className)

for(const s of sub || []){

await supabase.from("exam_subjects").insert({

exam_id: exam.id,
subject_id: s.id

})

}

}

alert("Exam created for ALL classes")

}else{

if(!selectedClass){
alert("Select class")
return
}

const { data:exam } = await supabase
.from("exams")
.insert({
name: examName,
class: selectedClass,
school_id: schoolId
})
.select()
.single()

for(const subjectId of selectedSubjects){

await supabase.from("exam_subjects").insert({

exam_id: exam.id,
subject_id: subjectId

})

}

alert("Exam Created")

}

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Create Exam
</h1>

<div className="flex gap-4 mb-4">

<input
value={examName}
onChange={(e)=>setExamName(e.target.value)}
placeholder="Exam Name"
className="bg-slate-800 p-2 rounded"
/>

<select
value={selectedClass}
onChange={(e)=>{
setSelectedClass(e.target.value)
loadSubjects(e.target.value)
}}
className="bg-slate-800 p-2 rounded"
>

<option value="">
Select Class
</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={createExam}
className="bg-green-600 px-6 py-2 rounded"
>
Create Exam
</button>

</div>

<label className="flex gap-2 mb-6">

<input
type="checkbox"
checked={createAll}
onChange={()=>setCreateAll(!createAll)}
/>

Create Exam For All Classes

</label>

<h2 className="text-xl mb-3">
Subjects
</h2>

{subjects.map(s=>(

<label key={s.id} className="flex gap-2 mb-1">

<input
type="checkbox"
checked={selectedSubjects.includes(s.id)}
onChange={()=>toggleSubject(s.id)}
/>

{s.name}

</label>

))}

</div>

)

}