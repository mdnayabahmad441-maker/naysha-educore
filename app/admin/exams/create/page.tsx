"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam(){

const [name,setName] = useState("")
const [classId,setClassId] = useState("")
const [classes,setClasses] = useState<any[]>([])
const [schoolId,setSchoolId] = useState("")

useEffect(()=>{
loadSchool()
},[])

async function loadSchool(){

  const { data:sessionData } = await supabase.auth.getSession()

  const userId = sessionData.session?.user.id

  if(!userId) return

  const { data:userData, error } =
    await supabase
      .from("users")
      .select("school_id")
      .eq("id",userId)
      .single()

  if(error || !userData){
    console.error("User not found")
    return
  }

  setSchoolId(userData.school_id)

  const { data:classData } =
    await supabase
      .from("classes")
      .select("*")
      .eq("school_id",userData.school_id)

  setClasses(classData || [])

}

async function createExam(){

await supabase
.from("exams")
.insert({
name:name,
class_id:classId,
school_id:schoolId
})

alert("Exam created")

setName("")
setClassId("")

}

return(

<div className="p-10 text-white">

<h1 className="text-2xl mb-6">
Create Exam
</h1>

<input
placeholder="Exam Name"
className="w-full p-2 mb-4 bg-slate-800 rounded"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<select
className="w-full p-2 mb-6 bg-slate-800 rounded"
value={classId}
onChange={(e)=>setClassId(e.target.value)}
>

<option>Select Class</option>

{classes.map(c=>(
<option key={c.id} value={c.id}>
{c.name}
</option>
))}

</select>

<button
onClick={createExam}
className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Create Exam
</button>

</div>

)

}