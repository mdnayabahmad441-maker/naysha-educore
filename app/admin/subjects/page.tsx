"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

const [schoolId,setSchoolId] = useState("")
const [name,setName] = useState("")
const [className,setClassName] = useState("")
const [subjects,setSubjects] = useState<any[]>([])
const [classes,setClasses] = useState<string[]>([])

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
loadSubjects(user.school_id)

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

async function loadSubjects(school:string){

const { data } = await supabase
.from("subjects")
.select("*")
.eq("school_id",school)

setSubjects(data || [])

}

async function addSubject(){

if(!name || !className){
alert("Enter subject and class")
return
}

await supabase.from("subjects").insert({

name,
class: className,
school_id: schoolId

})

setName("")

loadSubjects(schoolId)

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Subjects
</h1>

<div className="flex gap-4 mb-6">

<input
value={name}
onChange={(e)=>setName(e.target.value)}
placeholder="Subject Name"
className="bg-slate-800 p-2 rounded"
/>

<select
value={className}
onChange={(e)=>setClassName(e.target.value)}
className="bg-slate-800 p-2 rounded"
>

<option>Select Class</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={addSubject}
className="bg-green-600 px-6 py-2 rounded"
>
Add Subject
</button>

</div>

<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">

<th className="p-2">Subject</th>
<th className="p-2">Class</th>

</tr>

</thead>

<tbody>

{subjects.map(s=>(
<tr key={s.id}>

<td className="p-2">{s.name}</td>
<td className="p-2">{s.class}</td>

</tr>
))}

</tbody>

</table>

</div>

)

}