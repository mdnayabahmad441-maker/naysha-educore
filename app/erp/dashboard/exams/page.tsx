"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [schoolId,setSchoolId] = useState("")

const [sessions,setSessions] = useState<any[]>([])
const [selectedExam,setSelectedExam] = useState("")

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")

const [students,setStudents] = useState<any[]>([])
const [subject,setSubject] = useState("")

const [marks,setMarks] = useState<{[key:string]:number}>({})



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
loadClasses(data.school_id)

}

}



async function loadSessions(id:string){

const {data} =
await supabase
.from("exam_sessions")
.select("*")
.eq("school_id",id)

if(data){
setSessions(data)
}

}



async function loadClasses(id:string){

const {data} =
await supabase
.from("students")
.select("class")
.eq("school_id",id)

if(data){

const unique =
[...new Set(data.map((s:any)=>s.class))]

setClasses(unique)

}

}



async function loadStudents(){

if(!selectedClass) return

const {data} =
await supabase
.from("students")
.select("*")
.eq("class",selectedClass)
.eq("school_id",schoolId)

if(data){
setStudents(data)
}

}



async function saveMarks(){

for(const student of students){

const studentMarks =
marks[student.id] || 0

await supabase
.from("exam_marks")
.insert({

school_id:schoolId,
exam_id:selectedExam,
student_id:student.id,
subject:subject,
marks:studentMarks

})

}

alert("Marks Saved")

}



useEffect(()=>{
getSchool()
},[])

useEffect(()=>{
loadStudents()
},[selectedClass])



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Marks Entry
</h1>



<div className="bg-white/10 p-6 rounded-xl w-[500px] space-y-4 mb-10">


<select
className="w-full p-3 rounded bg-slate-800"
value={selectedExam}
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option>Select Exam</option>

{sessions.map((s)=>(
<option key={s.id} value={s.id}>
{s.exam_name}
</option>
))}

</select>



<select
className="w-full p-3 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>setSelectedClass(e.target.value)}
>

<option>Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>



<input
placeholder="Subject"
className="w-full p-3 rounded bg-slate-800"
value={subject}
onChange={(e)=>setSubject(e.target.value)}
/>


</div>



<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">
Enter Marks
</h2>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left p-2">Student</th>
<th>Marks</th>

</tr>

</thead>

<tbody>

{students.map((s)=>(

<tr key={s.id} className="border-b border-white/10">

<td className="p-2">{s.name}</td>

<td>

<input
type="number"
className="p-2 rounded bg-slate-800 w-24"
onChange={(e)=>

setMarks({

...marks,
[s.id]:Number(e.target.value)

})

}
/>

</td>

</tr>

))}

</tbody>

</table>


<button
onClick={saveMarks}
className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Save Marks

</button>


</div>

</div>

)

}