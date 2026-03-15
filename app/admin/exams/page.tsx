"use client"

import { useRouter } from "next/navigation"

export default function ExamsDashboard() {

const router = useRouter()

const items = [
{title:"Create Exam",path:"/admin/exams/create"},
{title:"Subjects",path:"/admin/exams/subjects"},
{title:"Class Subjects",path:"/admin/exams/class-subjects"},
{title:"Exam Subjects",path:"/admin/exams/exam-subjects"},
{title:"Enter Marks",path:"/admin/exams/marks"},
]

return (

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-8 font-semibold">Exam Module</h1>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

{items.map(item => (

<div
key={item.title}
onClick={()=>router.push(item.path)}
className="bg-white/10 border border-white/20 rounded-xl p-6 hover:bg-white/20 cursor-pointer"
>

{item.title}

</div>

))}

</div>

</div>

)

}