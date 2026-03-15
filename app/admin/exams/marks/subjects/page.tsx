"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

const [schoolId,setSchoolId] = useState("")
const [subjects,setSubjects] = useState<any[]>([])

const [className,setClassName] = useState("")
const [subjectName,setSubjectName] = useState("")
const [maxMarks,setMaxMarks] = useState("")
const [passMarks,setPassMarks] = useState("")

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
loadSubjects(user.school_id)

}

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

if(!className || !subjectName){
alert("Fill all fields")
return
}

await supabase
.from("subjects")
.insert({
school_id:schoolId,
class:className,
name:subjectName,
max_marks:maxMarks,
pass_marks:passMarks
})

setSubjectName("")
setMaxMarks("")
setPassMarks("")

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



function startEdit(subject:any){

setEditingId(subject.id)
setClassName(subject.class)
setSubjectName(subject.name)
setMaxMarks(subject.max_marks)
setPassMarks(subject.pass_marks)

}



async function updateSubject(){

if(!editingId) return

await supabase
.from("subjects")
.update({
class:className,
name:subjectName,
max_marks:maxMarks,
pass_marks:passMarks
})
.eq("id",editingId)

setEditingId(null)

setSubjectName("")
setMaxMarks("")
setPassMarks("")

loadSubjects(schoolId)

}



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Subjects Management
</h1>


<div className="bg-white/10 p-6 rounded mb-10">

<h2 className="text-xl mb-4">
{editingId ? "Edit Subject" : "Add Subject"}
</h2>

<div className="grid grid-cols-4 gap-4">

<select
className="p-2 rounded bg-slate-800"
value={className}
onChange={(e)=>setClassName(e.target.value)}
>

<option value="">Select Class</option>
<option value="01">01</option>
<option value="02">02</option>
<option value="03">03</option>
<option value="04">04</option>
<option value="05">05</option>

</select>

<input
placeholder="Subject Name"
className="p-2 rounded bg-slate-800"
value={subjectName}
onChange={(e)=>setSubjectName(e.target.value)}
/>

<input
placeholder="Max Marks"
className="p-2 rounded bg-slate-800"
value={maxMarks}
onChange={(e)=>setMaxMarks(e.target.value)}
/>

<input
placeholder="Pass Marks"
className="p-2 rounded bg-slate-800"
value={passMarks}
onChange={(e)=>setPassMarks(e.target.value)}
/>

</div>

{editingId ? (

<button
onClick={updateSubject}
className="mt-4 bg-yellow-600 px-6 py-2 rounded"
>
Update Subject
</button>

) : (

<button
onClick={addSubject}
className="mt-4 bg-green-600 px-6 py-2 rounded"
>
Add Subject
</button>

)}

</div>



<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">

<th className="p-2">Class</th>
<th className="p-2">Subject</th>
<th className="p-2">Max Marks</th>
<th className="p-2">Pass Marks</th>
<th className="p-2">Actions</th>

</tr>

</thead>

<tbody>

{subjects.map((s)=>(

<tr key={s.id}>

<td className="p-2">{s.class}</td>
<td className="p-2">{s.name}</td>
<td className="p-2">{s.max_marks}</td>
<td className="p-2">{s.pass_marks}</td>

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

</tbody>

</table>

</div>

)

}