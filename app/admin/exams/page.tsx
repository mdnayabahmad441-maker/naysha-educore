"use client"

import { useRouter } from "next/navigation"

const items=[
{title:"Create Exam",path:"/admin/exams/create"},
{title:"Subjects",path:"/admin/exams/subjects"},
{title:"Class Subjects",path:"/admin/exams/class-subjects"},
{title:"Exam Subjects",path:"/admin/exams/exam-subjects"},
{title:"Enter Marks",path:"/admin/exams/marks"},
{title:"Results",path:"/admin/exams/results"},
{title:"Report Cards",path:"/admin/exams/reportcards"},
{title:"Analytics",path:"/admin/exams/analytics"}
]

export default function Page(){

const router=useRouter()

return(

<div className="p-10 text-white">

<h1 className="text-2xl mb-8">Exam Module</h1>

<div className="grid grid-cols-4 gap-6">

{items.map((i)=>(
<div
key={i.title}
onClick={()=>router.push(i.path)}
className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 cursor-pointer hover:bg-white/20"
>

{i.title}

</div>
))}

</div>

</div>

)
}