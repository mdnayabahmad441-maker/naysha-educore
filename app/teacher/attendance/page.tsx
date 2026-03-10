"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TeacherAttendance(){

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")
const [students,setStudents] = useState<any[]>([])
const [attendance,setAttendance] = useState<any>({})
const [date,setDate] = useState("")
const [schoolId,setSchoolId] = useState<string | null>(null)


useEffect(()=>{
loadSchool()
},[])



async function loadSchool(){

const { data:userData } = await supabase.auth.getUser()

const userId = userData.user?.id

if(!userId) return

const { data:user } =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(!user) return

setSchoolId(user.school_id)


const { data } =
await supabase
.from("students")
.select("class")
.eq("school_id",user.school_id)

const uniqueClasses =
Array.from(new Set(data?.map((s:any)=>s.class)))

setClasses(uniqueClasses)

}



async function loadStudents(className:string){

setSelectedClass(className)

const { data } =
await supabase
.from("students")
.select("*")
.eq("class",className)

if(data){
setStudents(data)
}

}



function markStatus(studentId:string,status:string){

setAttendance((prev:any)=>({
...prev,
[studentId]:status
}))

}



async function saveAttendance(){

if(!date){
alert("Select date")
return
}

const records = students.map((s)=>({

student_id:s.id,
school_id:schoolId,
date:date,
status:attendance[s.id] || "absent"

}))


const { error } =
await supabase
.from("attendance")
.insert(records)

if(error){
alert(error.message)
return
}

alert("Attendance saved")

setAttendance({})

}



return(

<div>

<h1 className="text-3xl font-bold mb-8">
Mark Attendance
</h1>



{/* DATE */}

<div className="mb-6">

<input
type="date"
className="p-2 rounded bg-slate-800"
value={date}
onChange={(e)=>setDate(e.target.value)}
/>

</div>



{/* CLASS SELECT */}

<div className="bg-white/10 p-6 rounded-xl mb-8 w-[400px]">

<h2 className="text-xl mb-4">
Select Class
</h2>

<select
className="w-full p-2 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>loadStudents(e.target.value)}
>

<option value="">
Select Class
</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>

</div>



{/* STUDENTS LIST */}

{students.length > 0 && (

<div className="bg-white/10 p-6 rounded-xl">

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left py-2">
Student
</th>

<th>
Present
</th>

<th>
Absent
</th>

</tr>

</thead>

<tbody>

{students.map((s)=>(

<tr key={s.id} className="border-b border-white/10">

<td className="py-2">
{s.name}
</td>

<td>

<button
onClick={()=>markStatus(s.id,"present")}
className="bg-green-600 px-3 py-1 rounded"
>
Present
</button>

</td>

<td>

<button
onClick={()=>markStatus(s.id,"absent")}
className="bg-red-600 px-3 py-1 rounded"
>
Absent
</button>

</td>

</tr>

))}

</tbody>

</table>


<button
onClick={saveAttendance}
className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Save Attendance
</button>

</div>

)}

</div>

)

}