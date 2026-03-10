"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ReportCardGenerator(){

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")
const [students,setStudents] = useState<any[]>([])

useEffect(()=>{
loadClasses()
},[])

async function loadClasses(){

const { data } =
await supabase
.from("students")
.select("class")

const unique =
Array.from(new Set(data?.map((s:any)=>s.class)))

setClasses(unique)

}

async function loadStudents(className:string){

setSelectedClass(className)

const { data } =
await supabase
.from("students")
.select("*")
.eq("class",className)

setStudents(data || [])

}

async function generateReportCards(){

for(const student of students){

const { data:marks } =
await supabase
.from("results")
.select("*")
.eq("student_id",student.id)

let total = 0
let subjects = 0

marks?.forEach((m:any)=>{
total += Number(m.marks)
subjects++
})

const percent =
subjects > 0 ? Math.round(total / subjects) : 0

await supabase
.from("report_cards")
.insert({

student_id:student.id,
class:selectedClass,
total:total,
percentage:percent

})

}

alert("Report cards generated for class")

}

return(

<div>

<h1 className="text-3xl font-bold mb-8">
Generate Report Cards
</h1>

<select
className="p-2 bg-slate-800 rounded"
onChange={(e)=>loadStudents(e.target.value)}
>

<option>Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>

<button
onClick={generateReportCards}
className="ml-4 px-4 py-2 bg-green-600 rounded"
>
Generate All
</button>

<div className="mt-8">

{students.map((s)=>(

<p key={s.id}>
{s.name}
</p>

))}

</div>

</div>

)

}