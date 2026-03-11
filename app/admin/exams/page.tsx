"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ExamsPage(){

const [schoolId,setSchoolId] = useState<string | null>(null)

const [examName,setExamName] = useState("")
const [selectedClass,setSelectedClass] = useState("")

const [classes,setClasses] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [exams,setExams] = useState<any[]>([])



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



async function loadSubjects(classId:string){

const { data } =
await supabase
.from("subjects")
.select("*")
.eq("class_id",classId)

if(data){
setSubjects(data)
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



async function createExam(){

if(!examName){
alert("Enter exam name")
return
}

if(!schoolId) return



// create exam for specific class

if(selectedClass !== "all"){

const { error } =
await supabase
.from("exams")
.insert({
name:examName,
class_id:selectedClass,
school_id:schoolId
})

if(error){
alert(error.message)
return
}

alert("Exam created")

}



// create exam for all classes

if(selectedClass === "all"){

for(const c of classes){

await supabase
.from("exams")
.insert({
name:examName,
class_id:c.id,
school_id:schoolId
})

}

alert("Exam created for all classes")

}

setExamName("")
setSelectedClass("")

loadExams(schoolId)

}



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Exam Management
</h1>



<div className="bg-white/10 p-6 rounded-xl w-[400px] mb-10">

<h2 className="text-xl font-bold mb-4">
Create Exam
</h2>

<input
placeholder="Exam Name"
className="w-full p-2 mb-4 rounded bg-slate-800"
value={examName}
onChange={(e)=>setExamName(e.target.value)}
/>



<select
className="w-full p-2 mb-4 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>{

setSelectedClass(e.target.value)

if(e.target.value !== "all"){
loadSubjects(e.target.value)
}

}}
>

<option value="">Select Class</option>

<option value="all">
All Classes
</option>

{classes.map((c)=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>



<button
onClick={createExam}
className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Create Exam
</button>

</div>



<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-6">
Exams List
</h2>

<table className="w-full">

<thead>

<tr className="border-b border-white/20">

<th className="text-left py-2">
Exam
</th>

<th>
Class
</th>

</tr>

</thead>

<tbody>

{exams.map((e)=>(
<tr key={e.id} className="border-b border-white/10">

<td className="py-2">
{e.name}
</td>

<td>
{e.class_id}
</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

)

}