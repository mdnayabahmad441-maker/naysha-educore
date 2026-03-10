"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

export default function StudentProfile(){

const params = useParams()

const [student,setStudent] = useState<any>(null)
const [attendance,setAttendance] = useState<any[]>([])
const [fees,setFees] = useState<any[]>([])

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

const { data:att } =
await supabase
.from("attendance")
.select("*")
.eq("student_id",params.id)

setAttendance(att || [])

const { data:feesData } =
await supabase
.from("fees")
.select("*")
.eq("student_id",params.id)

setFees(feesData || [])

}

if(!student){
return <p className="p-10 text-white">Loading...</p>
}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
{student.name}
</h1>

<div className="bg-white/10 p-6 rounded-xl mb-6">

<p>Class: {student.class}</p>
<p>Roll: {student.roll_number}</p>

</div>

</div>

)

}