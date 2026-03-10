"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentResults(){

const [results,setResults] = useState<any[]>([])
const [student,setStudent] = useState<any>(null)

useEffect(()=>{
loadResults()
},[])

async function loadResults(){

const { data:userData } = await supabase.auth.getUser()

const email = userData.user?.email

if(!email) return


const { data:studentData } =
await supabase
.from("students")
.select("*")
.eq("parent_email",email)
.single()

if(!studentData) return

setStudent(studentData)


const { data } =
await supabase
.from("results")
.select("*")
.eq("student_id",studentData.id)

setResults(data || [])

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Exam Results
</h1>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left py-2">Subject</th>
<th>Marks</th>

</tr>

</thead>

<tbody>

{results.map((r)=>(
<tr key={r.id} className="border-b border-white/10">

<td className="py-2">{r.subject}</td>
<td>{r.marks}</td>

</tr>
))}

</tbody>

</table>

</div>

)

}