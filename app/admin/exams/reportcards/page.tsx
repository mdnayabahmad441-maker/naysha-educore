"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ReportCards(){

const [students,setStudents] = useState<any[]>([])
const [schoolId,setSchoolId] = useState("")

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

const { data } =
await supabase
.from("students")
.select("*")
.eq("school_id",user.school_id)

setStudents(data || [])

}

}

function downloadReport(student:any){

alert("Report card generation coming next step")

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl mb-8">
Report Cards
</h1>

<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">

<th className="p-2 text-left">
Student
</th>

<th className="p-2">
Class
</th>

<th className="p-2">
Action
</th>

</tr>

</thead>

<tbody>

{students.map((s)=>(
<tr key={s.id}>

<td className="p-2">
{s.name}
</td>

<td className="p-2">
{s.class}
</td>

<td className="p-2">

<button
onClick={()=>downloadReport(s)}
className="bg-green-600 px-4 py-1 rounded"
>
Download
</button>

</td>

</tr>
))}

</tbody>

</table>

</div>

)

}