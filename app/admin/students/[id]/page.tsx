"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"
import DocumentUploader from "@/components/DocumentUploader"

export default function StudentProfile(){

const params = useParams()

const [student,setStudent] = useState<any>(null)

useEffect(()=>{
loadStudent()
},[])

async function loadStudent(){

const { data } =
await supabase
.from("students")
.select("*")
.eq("id",params.id)
.single()

setStudent(data)

}

if(!student) return <p>Loading...</p>

return(

<div className="p-6">

<h1 className="text-3xl font-bold mb-6">
{student.name}
</h1>

<div className="grid md:grid-cols-2 gap-6">

<div className="bg-white/10 p-6 rounded-xl">

<p>Class: {student.class}</p>
<p>Roll: {student.roll_number}</p>
<p>Father: {student.father_name}</p>
<p>Mother: {student.mother_name}</p>
<p>Phone: {student.parent_phone}</p>

</div>

<DocumentUploader studentId={student.id}/>

</div>

</div>

)

}