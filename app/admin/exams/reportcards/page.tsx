"use client"

import { useEffect,useState,useRef } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function ReportCardsPage(){

const [students,setStudents] = useState<any[]>([])
const [subjects,setSubjects] = useState<any[]>([])
const [marks,setMarks] = useState<any[]>([])
const [school,setSchool] = useState<any>(null)

const [exam,setExam] = useState("")
const [className,setClassName] = useState("")

const reportRef = useRef<HTMLDivElement>(null)

useEffect(()=>{
loadSchool()
},[])

/* LOAD SCHOOL */

async function loadSchool(){

const {data:userData}=await supabase.auth.getUser()

const userId=userData.user?.id

if(!userId) return

const {data:user}=await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(!user) return

const {data:schoolData}=await supabase
.from("schools")
.select("*")
.eq("id",user.school_id)
.single()

setSchool(schoolData)

}

/* LOAD DATA */

async function loadData(){

const {data:studentsData}=await supabase
.from("students")
.select("*")
.eq("class",className)

const {data:subjectsData}=await supabase
.from("subjects")
.select("*")
.eq("class",className)

const {data:marksData}=await supabase
.from("marks")
.select("*")
.eq("exam_id",exam)

setStudents(studentsData || [])
setSubjects(subjectsData || [])
setMarks(marksData || [])

}

/* MARKS */

function getMarks(studentId:string,subjectId:string){

const m=marks.find(
(x:any)=>x.student_id===studentId && x.subject_id===subjectId
)

if(!m) return "Absent"

return m.marks

}

/* TOTAL */

function totalMarks(studentId:string){

let total=0

subjects.forEach((s:any)=>{

const m=marks.find(
(x:any)=>x.student_id===studentId && x.subject_id===s.id
)

if(m && m.marks!=="Absent"){
total+=Number(m.marks)
}

})

return total

}

/* PERCENTAGE */

function percentage(studentId:string){

const total=totalMarks(studentId)

const max=subjects.length*100

if(max===0) return 0

return Number(((total/max)*100).toFixed(2))

}

/* GRADE */

function grade(p:number){

if(p>=90) return "A+"
if(p>=80) return "A"
if(p>=70) return "B"
if(p>=60) return "C"
if(p>=33) return "D"

return "F"

}

/* RANK */

function calculateRanks(){

const list=students.map((s:any)=>{

return{
student:s,
percent:percentage(s.id)
}

})

list.sort((a,b)=>b.percent-a.percent)

return list

}

const rankedStudents=calculateRanks()

/* PDF */

async function downloadPDF(){

const input=reportRef.current

if(!input) return

const canvas=await html2canvas(input)

const img=canvas.toDataURL("image/png")

const pdf=new jsPDF()

const width=210
const height=canvas.height*width/canvas.width

pdf.addImage(img,"PNG",0,0,width,height)

pdf.save("reportcards.pdf")

}

return(

<div className="p-6 text-white">

<h1 className="text-3xl font-bold mb-8">
Report Cards
</h1>


{/* CONTROLS */}

<div className="flex flex-col md:flex-row gap-4 mb-8">

<input
placeholder="Exam ID"
value={exam}
onChange={(e)=>setExam(e.target.value)}
className="p-2 rounded bg-slate-800"
/>

<input
placeholder="Class"
value={className}
onChange={(e)=>setClassName(e.target.value)}
className="p-2 rounded bg-slate-800"
/>

<button
onClick={loadData}
className="px-4 py-2 bg-purple-600 rounded"
>
Load Data
</button>

</div>


{/* REPORT */}

<div ref={reportRef} className="bg-white text-black p-6 rounded-xl overflow-x-auto">

{/* SCHOOL */}

<div className="flex items-center gap-4 mb-6">

{school?.logo_url && (

<img
src={school.logo_url}
className="h-16"
/>

)}

<div>

<h2 className="text-2xl font-bold">
{school?.name}
</h2>

<p>{school?.address}</p>

</div>

</div>


<table className="w-full border border-black text-sm">

<thead>

<tr className="border-b border-black">

<th className="p-2">Rank</th>
<th>Student</th>

{subjects.map((s:any)=>(
<th key={s.id}>{s.name}</th>
))}

<th>Total</th>
<th>%</th>
<th>Grade</th>

</tr>

</thead>


<tbody>

{rankedStudents.map((item:any,index:number)=>{

const s=item.student
const p=item.percent
const total=totalMarks(s.id)
const g=grade(p)

let medal=""

if(index===0) medal="🥇"
if(index===1) medal="🥈"
if(index===2) medal="🥉"

return(

<tr
key={s.id}
className={
p<33
?"bg-red-200"
:""
}
>

<td className="text-center">
{index+1} {medal}
</td>

<td className="p-2">
{s.name}
</td>

{subjects.map((sub:any)=>(
<td key={sub.id} className="text-center">
{getMarks(s.id,sub.id)}
</td>
))}

<td className="text-center">
{total}
</td>

<td className="text-center">
{p}%
</td>

<td className="text-center">
{g}
</td>

</tr>

)

})}

</tbody>

</table>

</div>


<button
onClick={downloadPDF}
className="mt-6 px-6 py-2 bg-green-600 rounded"
>
Download PDF
</button>


</div>

)

}