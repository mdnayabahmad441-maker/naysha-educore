"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import ExcelMarksGrid from "@/components/ExcelMarksGrid"

export default function MarksPage(){

const [students,setStudents]=useState<any[]>([])
const [subjects,setSubjects]=useState<any[]>([])

async function load(){

const {data:st}=await supabase.from("students").select("*")
setStudents(st||[])

const {data:sub}=await supabase.from("subjects").select("*")
setSubjects(sub||[])

}

useEffect(()=>{load()},[])

return(

<div className="p-8 space-y-6">

<h1 className="text-xl font-bold">Marks Entry</h1>

<ExcelMarksGrid
students={students}
subjects={subjects}
/>

<div className="flex gap-4">

<button className="bg-blue-600 text-white px-4 py-2 rounded">
Save Marks
</button>

<button className="bg-yellow-600 text-white px-4 py-2 rounded">
Verify
</button>

<button className="bg-purple-600 text-white px-4 py-2 rounded">
Create Results
</button>

<button className="bg-green-600 text-white px-4 py-2 rounded">
Publish
</button>

</div>

</div>

)
}