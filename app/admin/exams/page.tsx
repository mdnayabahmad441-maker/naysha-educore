"use client"

import Link from "next/link"

export default function ExamsPage(){

const cards = [
{title:"Create Exam",link:"/admin/exams/create"},
{title:"Enter Marks",link:"/admin/exams/marks"},
{title:"Results",link:"/admin/exams/results"},
{title:"Report Cards",link:"/admin/exams/reportcards"},
{title:"Subjects",link:"/admin/exams/subjects"}
]

return(

<div className="p-10 text-white">

<h1 className="text-4xl font-bold mb-10">
Exam Management
</h1>

<div className="grid grid-cols-2 gap-8 max-w-xl">

{cards.map(c=>(

<Link
key={c.title}
href={c.link}
className="bg-white/10 hover:bg-white/20 p-10 rounded text-center text-xl"
>

{c.title}

</Link>

))}

</div>

</div>

)

}