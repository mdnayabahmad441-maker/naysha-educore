"use client"

import Link from "next/link"

export default function ExamsDashboard(){

return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Exam Management
</h1>

<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

<Link
href="/admin/exams/create"
className="bg-white/10 p-6 rounded-xl text-center hover:bg-white/20"
>
Create Exam
</Link>

<Link
href="/admin/exams/marks"
className="bg-white/10 p-6 rounded-xl text-center hover:bg-white/20"
>
Enter Marks
</Link>

<Link
href="/admin/exams/results"
className="bg-white/10 p-6 rounded-xl text-center hover:bg-white/20"
>
Results
</Link>

<Link
href="/admin/exams/reportcards"
className="bg-white/10 p-6 rounded-xl text-center hover:bg-white/20"
>
Report Cards
</Link>

</div>

</div>

)

}