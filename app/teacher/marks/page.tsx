"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage(){

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")
const [students,setStudents] = useState<any[]>([])
const [exam,setExam] = useState("")
const [subjects] = useState(["Maths","English","Science","Social"])
const [marks,setMarks] = useState<any>({})

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

function updateMarks(studentId:string,subject:string,value:string){

setMarks((prev:any)=>({

...prev,
[studentId]:{
...prev[studentId],
[subject]:value
}

}))

}

async function saveMarks(){

const records:any[] = []

students.forEach((s)=>{

subjects.forEach((sub)=>{

records.push({

student_id:s.id,
subject:sub,
marks:marks[s.id]?.[sub] || 0

})

})

})

await supabase.from("results").insert(records)

alert("Marks saved")

}

return(

<div>

<h1 className="text-3xl font-bold mb-8">
Enter Marks
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


{students.length > 0 && (

<div className="mt-6">

<table className="w-full">

<thead>

<tr>

<th>Student</th>

{subjects.map((s)=>(
<th key={s}>{s}</th>
))}

</tr>

</thead>

<tbody>

{students.map((s)=>(

<tr key={s.id}>

<td>{s.name}</td>

{subjects.map((sub)=>(

<td key={sub}>

<input
className="w-16 bg-slate-800 p-1"
onChange={(e)=>
updateMarks(s.id,sub,e.target.value)
}
/>

</td>

))}

</tr>

))}

</tbody>

</table>


<button
onClick={saveMarks}
className="mt-6 bg-green-600 px-4 py-2 rounded"
>
Save Marks
</button>

</div>

)}

</div>

)

}