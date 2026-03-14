"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function StudentForm(){

const [form,setForm] = useState<any>({})

function handleChange(e:any){

setForm({
...form,
[e.target.name]:e.target.value
})

}

async function createStudent(){

const { data:user } =
await supabase.auth.getUser()

const userId = user.user?.id

const { data:userRow } =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

const schoolId = userRow?.school_id

const { data,error } =
await supabase
.from("students")
.insert({
...form,
school_id:schoolId
})
.select()
.single()

if(error){

alert(error.message)
return

}

if(form.parent_email){

await supabase
.from("parents")
.insert({
student_id:data.id,
email:form.parent_email,
phone:form.parent_phone,
father_name:form.father_name,
mother_name:form.mother_name
})

}

alert("Student created")

}

return(

<div className="grid md:grid-cols-2 gap-4 bg-white/10 p-6 rounded-xl">

<input name="name" placeholder="Student Name" onChange={handleChange} className="input"/>
<input name="class" placeholder="Class" onChange={handleChange} className="input"/>
<input name="roll_number" placeholder="Roll Number" onChange={handleChange} className="input"/>

<input name="father_name" placeholder="Father Name" onChange={handleChange} className="input"/>
<input name="mother_name" placeholder="Mother Name" onChange={handleChange} className="input"/>

<input name="parent_email" placeholder="Parent Email" onChange={handleChange} className="input"/>
<input name="parent_phone" placeholder="Parent Phone" onChange={handleChange} className="input"/>

<input name="address" placeholder="Address" onChange={handleChange} className="input"/>

<input name="previous_school" placeholder="Previous School" onChange={handleChange} className="input"/>

<button
onClick={createStudent}
className="col-span-2 bg-gradient-to-r from-cyan-500 to-purple-600 py-2 rounded"
>
Create Student
</button>

</div>

)

}