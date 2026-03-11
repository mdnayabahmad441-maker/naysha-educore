"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [schoolId,setSchoolId] = useState<string | null>(null)

const [classes,setClasses] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [students,setStudents] = useState<any[]>([])
const [exams,setExams] = useState<any[]>([])

const [selectedClass,setSelectedClass] = useState("")
const [selectedExam,setSelectedExam] = useState("")

const [marks,setMarks] = useState<any>({})



useEffect(()=>{
loadSchool()
},[])



async function loadSchool(){

const { data } = await supabase.auth.getSession()

const userId = data.session?.user.id

if(!userId) return

const { data:user } =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(user){

setSchoolId(user.school_id)

loadClasses(user.school_id)
loadExams(user.school_id)

}

}



async function loadClasses(id:string){

const { data } =
await supabase
.from("classes")
.select("*")
.eq("school_id",id)

if(data){
setClasses(data)
}

}



async function loadExams(id:string){

const { data } =
await supabase
.from("exams")
.select("*")
.eq("school_id",id)

if(data){
setExams(data)
}

}



async function loadStudentsAndSubjects(classId:string){

if(!schoolId) return

const { data:studentData } =
await supabase
.from("students")
.select("*")
.eq("school_id",schoolId)
.eq("class",classId)

const { data:subjectData } =
await supabase
.from("subjects")
.select("*")
.eq("class_id",classId)

if(studentData) setStudents(studentData)
if(subjectData) setSubjects(subjectData)

}



function updateMark(studentId:string,subjectId:string,value:string){

setMarks({
...marks,
[studentId]:{
...marks[studentId],
[subjectId]:value
}
})

}



async function saveMarks(){

if(!selectedExam){
alert("Select exam")
return
}

for(const studentId in marks){

for(const subjectId in marks[studentId]){

await supabase
.from("marks")
.insert({
student_id:studentId,
subject_id:subjectId,
exam_id:selectedExam,
marks:marks[studentId][subjectId],
school_id:schoolId
})

}

}

alert("Marks saved successfully")

}



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Marks Entry
</h1>



{/* SELECT OPTIONS */}

<div className="flex gap-4 mb-6">

<select
className="bg-slate-800 p-2 rounded"
value={selectedExam}
onChange={(e)=>setSelectedExam(e.target.value)}
>

<option value="">Select Exam</option>

{exams.map((e)=>(
<option key={e.id} value={e.id}>
{e.name}
</option>
))}

</select>



<select
className="bg-slate-800 p-2 rounded"
value={selectedClass}
onChange={(e)=>{

setSelectedClass(e.target.value)
loadStudentsAndSubjects(e.target.value)

}}
>

<option value="">Select Class</option>

{classes.map((c)=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>

</div>



{/* EXCEL STYLE TABLE */}

<div className="overflow-x-auto">

<table className="min-w-full bg-white/10 rounded-xl">

<thead>

<tr>

<th className="p-3 text-left">
Student
</th>

{subjects.map((s)=>(
<th key={s.id} className="p-3">
{s.name}
</th>
))}

</tr>

</thead>



<tbody>

{students.map((student)=>(

<tr key={student.id} className="border-t border-white/10">

<td className="p-3 font-medium">
{student.name}
</td>



{subjects.map((subject)=>(

<td key={subject.id} className="p-2">

<input
type="number"
className="w-20 bg-slate-800 p-1 rounded"
onChange={(e)=>updateMark(
student.id,
subject.id,
e.target.value
)}
/>

</td>

))}

</tr>

))}

</tbody>

</table>

</div>



<button
onClick={saveMarks}
className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Save All Marks
</button>



</div>

)

}