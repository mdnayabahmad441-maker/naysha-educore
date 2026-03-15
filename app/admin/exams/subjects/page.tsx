"use client"

import { useRouter } from "next/navigation"

export default function ExamsDashboard(){

const router = useRouter()

const cards = [
{title:"Create Exam",path:"/admin/exams/create"},
{title:"Subjects",path:"/admin/exams/subjects"},
{title:"Class Subjects",path:"/admin/exams/class-subjects"},
{title:"Exam Subjects",path:"/admin/exams/exam-subjects"},
{title:"Enter Marks",path:"/admin/exams/marks"}
]

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-3xl font-semibold mb-10">
Exam Module
</h1>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

{cards.map(card=>(

<div
key={card.title}
onClick={()=>router.push(card.path)}
className="bg-white/10 border border-white/20 rounded-xl p-6 cursor-pointer hover:bg-white/20 text-center"
>

<h2 className="text-lg">
{card.title}
</h2>

</div>

))}

</div>

</div>

)

}