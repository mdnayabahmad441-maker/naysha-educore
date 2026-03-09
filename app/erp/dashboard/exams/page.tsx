"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function ExamsPage(){

const [schoolId,setSchoolId] = useState("")

const [examName,setExamName] = useState("")
const [examType,setExamType] = useState("")
const [scope,setScope] = useState("ALL")

const [sessions,setSessions] = useState<any[]>([])

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
}

}


async function loadSessions(id:string){

const {data} =
await supabase
.from("exam_sessions")
.select("*")
.eq("school_id",id)
.order("created_at",{ascending:false})

if(data){
setSessions(data)
}

}


async function createExam(){

if(!examName){
alert("Enter exam name")
return
}

const {error} =
await supabase
.from("exam_sessions")
.insert({

school_id:schoolId,
exam_name:examName,
exam_type:examType,
class_scope:scope

})

if(error){
alert(error.message)
return
}

alert("Exam Session Created")

setExamName("")
setExamType("")

loadSessions(schoolId)

}


useEffect(()=>{
getSchool()
},[])


return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Exam Sessions
</h1>

<div className="bg-white/10 p-6 rounded-xl w-[400px] space-y-4 mb-10">

<input
placeholder="Exam Name (Mid Term)"
className="w-full p-3 rounded bg-slate-800"
value={examName}
onChange={(e)=>setExamName(e.target.value)}
/>

<select
className="w-full p-3 rounded bg-slate-800"
value={examType}
onChange={(e)=>setExamType(e.target.value)}
>

<option value="">Exam Type</option>
<option>Weekly Test</option>
<option>Unit Test</option>
<option>Monthly Test</option>
<option>Mid Term</option>
<option>Half Yearly</option>
<option>Final</option>

</select>


<select
className="w-full p-3 rounded bg-slate-800"
value={scope}
onChange={(e)=>setScope(e.target.value)}
>

<option value="ALL">All Classes</option>
<option value="CLASS">Specific Class</option>

</select>


<button
onClick={createExam}
className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Create Exam Session

</button>

</div>


<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">
Exam Sessions
</h2>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left p-2">Exam</th>
<th>Type</th>
<th>Scope</th>

</tr>

</thead>

<tbody>

{sessions.map((s)=>(

<tr key={s.id} className="border-b border-white/10">

<td className="p-2">{s.exam_name}</td>
<td>{s.exam_type}</td>
<td>{s.class_scope}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}