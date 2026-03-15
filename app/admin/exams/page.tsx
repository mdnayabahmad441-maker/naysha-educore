"use client"

import Link from "next/link"

export default function ExamsPage(){

const modules = [
{title:"Create Exam",path:"/admin/exams/create"},
{title:"Subjects",path:"/admin/exams/subjects"},
{title:"Class Subjects",path:"/admin/exams/class-subjects"},
{title:"Exam Subjects",path:"/admin/exams/exam-subjects"},
{title:"Enter Marks",path:"/admin/exams/marks"}
]

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-3xl font-semibold mb-10 text-center">
Exam Module
</h1>

<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

{modules.map((m)=> (

<Link
key={m.title}
href={m.path}
className="bg-white/10 border border-white/20 rounded-xl p-8 text-center hover:bg-white/20 hover:scale-105 transition block"
>

<h2 className="text-lg font-medium">
{m.title}
</h2>

</Link>

))}

</div>

</div>

)

}