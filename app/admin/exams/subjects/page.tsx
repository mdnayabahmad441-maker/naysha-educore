"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

const [schoolId,setSchoolId] = useState("")
const [name,setName] = useState("")
const [className,setClassName] = useState("")
const [subjects,setSubjects] = useState<any[]>([])
const [classes,setClasses] = useState<string[]>([])
const [editingId,setEditingId] = useState<number | null>(null)

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
.order("class",{ascending:true})

setSubjects(data || [])

}

async function addSubject(){

if(!name || !className){
alert("Enter subject and class")
return
}

/* prevent duplicates */

const exists = subjects.find(
s => s.name.toLowerCase() === name.toLowerCase() && s.class === className
)

if(exists){
alert("Subject already exists in this class")
return
}

await supabase.from("subjects").insert({

name,
class: className,
school_id: schoolId

})

setName("")
setClassName("")

loadSubjects(schoolId)

}

function startEdit(subject:any){

setEditingId(subject.id)
setName(subject.name)
setClassName(subject.class)

}

async function updateSubject(){

if(!editingId) return

await supabase
.from("subjects")
.update({
name,
class:className
})
.eq("id",editingId)

setEditingId(null)
setName("")
setClassName("")

loadSubjects(schoolId)

}

async function deleteSubject(id:number){

if(!confirm("Delete this subject?")) return

await supabase
.from("subjects")
.delete()
.eq("id",id)

loadSubjects(schoolId)

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Subjects
</h1>

<div className="flex gap-4 mb-6 flex-wrap">

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

<option value="">Select Class</option>

{classes.map(c=>(
<option key={c}>{c}</option>
))}

</select>

{editingId ? (

<button
onClick={updateSubject}
className="bg-yellow-500 px-6 py-2 rounded"
>
Update Subject
</button>

) : (

<button
onClick={addSubject}
className="bg-green-600 px-6 py-2 rounded"
>
Add Subject
</button>

)}

</div>

<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">

<th className="p-2">Subject</th>
<th className="p-2">Class</th>
<th className="p-2">Actions</th>

</tr>

</thead>

<tbody>

{classes.map((cls)=>{

const classSubjects = subjects.filter(s => s.class === cls)

if(classSubjects.length === 0) return null

return(

<>
<tr className="bg-white/10">
<td colSpan={3} className="p-3 font-bold text-left">
Class {cls}
</td>
</tr>

{classSubjects.map((s)=>(
<tr key={s.id}>

<td className="p-2">{s.name}</td>
<td className="p-2">{s.class}</td>

<td className="p-2 flex gap-2">

<button
onClick={()=>startEdit(s)}
className="bg-blue-600 px-3 py-1 rounded"
>
Edit
</button>

<button
onClick={()=>deleteSubject(s.id)}
className="bg-red-600 px-3 py-1 rounded"
>
Delete
</button>

</td>

</tr>
))}

</>

)

})}

</tbody>

</table>

</div>

)

}