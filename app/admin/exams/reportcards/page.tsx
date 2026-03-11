"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function ReportCards(){

const [students,setStudents] = useState<any[]>([])

useEffect(()=>{
loadStudents()
},[])

async function loadStudents(){

const { data } = await supabase
.from("students")
.select("*")

setStudents(data || [])

}

async function generateReport(student:any){

const { data:marks } = await supabase
.from("marks")
.select("*")
.eq("student_id",student.id)

if(!marks) return

let total = 0
let rows:any[] = []

for(const m of marks){

const { data:subject } = await supabase
.from("subjects")
.select("name")
.eq("id",m.subject_id)
.single()

total += m.marks

rows.push([
subject?.name,
m.marks
])

}

const percentage = total / marks.length

let grade = "D"

if(percentage >= 90) grade="A+"
else if(percentage >= 80) grade="A"
else if(percentage >= 70) grade="B"
else if(percentage >= 60) grade="C"

const doc = new jsPDF()

doc.setFontSize(18)
doc.text("School Report Card", 70, 20)

doc.setFontSize(12)
doc.text(`Student: ${student.name}`, 20, 40)
doc.text(`Class: ${student.class}`, 20, 50)

autoTable(doc,{
startY:60,
head:[["Subject","Marks"]],
body:rows
})

doc.text(`Total: ${total}`,20,140)
doc.text(`Percentage: ${percentage.toFixed(2)}%`,20,150)
doc.text(`Grade: ${grade}`,20,160)

doc.save(`${student.name}-report-card.pdf`)

}

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-6">
Report Cards
</h1>

<table className="w-full border border-white/20">

<thead>

<tr className="bg-white/10">
<th className="p-2">Student</th>
<th className="p-2">Class</th>
<th className="p-2">Action</th>
</tr>

</thead>

<tbody>

{students.map(s=>(
<tr key={s.id}>

<td className="p-2">{s.name}</td>
<td className="p-2">{s.class}</td>

<td className="p-2">
<button
onClick={()=>generateReport(s)}
className="bg-green-600 px-4 py-2 rounded"
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