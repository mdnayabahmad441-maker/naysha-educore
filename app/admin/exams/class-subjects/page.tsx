"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ClassSubjectsPage(){

const schoolId = "1"

const [subjects,setSubjects]=useState<any[]>([])

useEffect(()=>{

supabase
.from("subjects")
.select("*")
.eq("school_id",schoolId)
.order("name")
.then(res=>setSubjects(res.data || []))

},[])

return(

<div className="p-10 text-white max-w-6xl mx-auto">

<h1 className="text-2xl mb-6">Class Subject Mapping</h1>

<div className="bg-white/10 border border-white/20 rounded-xl p-6">

<select className="text-black p-2 rounded">

<option>Select Subject</option>

{subjects.map(sub=>(
<option key={sub.id} value={sub.id}>
{sub.name}
</option>
))}

</select>

</div>

</div>

)

}