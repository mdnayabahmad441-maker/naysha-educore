"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam(){

const [schoolId,setSchoolId] = useState("")
const [classes,setClasses] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])

const [className,setClassName] = useState("")
const [examName,setExamName] = useState("")

useEffect(()=>{
loadSchool()
},[])

async function loadSchool(){

const { data } = await supabase.auth.getSession()

const userId = data.session?.user.id

const { data:user } =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(user){

setSchoolId(user.school_id)

const { data:classData } =
await supabase
.from("students")
.select("class")
.eq("school_id",user.school_id)

const uniqueClasses = [...new Set(classData?.map(c=>c.class))]
setClasses(uniqueClasses)

}

}

async function loadSubjects(selectedClass:string){

setClassName(selectedClass)

const { data } =
await supabase
.from("subjects")
.select("*")
.eq("class",selectedClass)

setSubjects(data || [])

}

async function createExam(){

await supabase
.from("exams")
.insert({
name:examName,
class:className,
school_id:schoolId
})

alert("Exam Created")

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl mb-6">Create Exam</h1>

<input
placeholder="Exam Name"
className="p-2 mb-4 bg-slate-800 rounded"
value={examName}
onChange={(e)=>setExamName(e.target.value)}
/>

<select
className="p-2 mb-6 bg-slate-800 rounded"
onChange={(e)=>loadSubjects(e.target.value)}
>

<option>Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>

<h3 className="mb-2">Subjects</h3>

<ul className="mb-6">

{subjects.map((s)=>(
<li key={s.id}>{s.name}</li>
))}

</ul>

<button
onClick={createExam}
className="bg-green-600 px-6 py-2 rounded"
>
Create Exam
</button>

</div>

)

}