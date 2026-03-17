"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function StudentPage(){

const [studentId,setStudentId] = useState<any>(null)

const [name,setName] = useState("")
const [father,setFather] = useState("")
const [mother,setMother] = useState("")
const [phone,setPhone] = useState("")
const [email,setEmail] = useState("")

const [photo,setPhoto] = useState<any>(null)
const [aadhar,setAadhar] = useState<any>(null)
const [medical,setMedical] = useState<any>(null)
const [tc,setTc] = useState<any>(null)

/* FILE UPLOAD */

const uploadFile = async(file:any,path:string)=>{

if(!file) return null

const { data,error } = await supabase.storage
.from("student-files")
.upload(path,file)

if(error){
console.log(error)
return null
}

const { data:url } = supabase.storage
.from("student-files")
.getPublicUrl(data.path)

return url.publicUrl

}

/* CREATE STUDENT */

const createStudent = async()=>{

const schoolId = await getSchoolId()

const { data:student } = await supabase
.from("students")
.insert({
name,
school_id:schoolId
})
.select()
.single()

if(!student) return

setStudentId(student.id)

/* PHOTO */

const photoUrl = await uploadFile(photo,`photos/${student.id}`)

if(photoUrl){

await supabase
.from("students")
.update({photo_url:photoUrl})
.eq("id",student.id)

}

/* PARENTS */

await supabase
.from("parents")
.insert({
student_id:student.id,
father_name:father,
mother_name:mother,
phone,
email
})

/* DOCUMENTS */

const aadharUrl = await uploadFile(aadhar,`documents/${student.id}/aadhar`)
const medicalUrl = await uploadFile(medical,`documents/${student.id}/medical`)
const tcUrl = await uploadFile(tc,`documents/${student.id}/tc`)

if(aadharUrl){

await supabase.from("student_documents").insert({
student_id:student.id,
document_type:"aadhar",
file_url:aadharUrl
})

}

if(medicalUrl){

await supabase.from("student_documents").insert({
student_id:student.id,
document_type:"medical",
file_url:medicalUrl
})

}

if(tcUrl){

await supabase.from("student_documents").insert({
student_id:student.id,
document_type:"transfer_certificate",
file_url:tcUrl
})

}

alert("Student Created")

}

/* UPDATE */

const updateStudent = async()=>{

if(!studentId) return

await supabase
.from("students")
.update({
name
})
.eq("id",studentId)

await supabase
.from("parents")
.update({
father_name:father,
mother_name:mother,
phone,
email
})
.eq("student_id",studentId)

alert("Student Updated")

}

/* DELETE */

const deleteStudent = async()=>{

if(!studentId) return

await supabase
.from("students")
.delete()
.eq("id",studentId)

alert("Student Deleted")

setName("")
setFather("")
setMother("")
setPhone("")
setEmail("")
setStudentId(null)

}

return(

<div className="p-10 text-white max-w-3xl mx-auto">

<h1 className="text-2xl mb-6">
Student Profile
</h1>

<div className="space-y-4">

<input
className="bg-slate-800 border border-white/20 p-2 rounded w-full"
placeholder="Student Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<input
className="bg-slate-800 border border-white/20 p-2 rounded w-full"
placeholder="Father Name"
value={father}
onChange={(e)=>setFather(e.target.value)}
/>

<input
className="bg-slate-800 border border-white/20 p-2 rounded w-full"
placeholder="Mother Name"
value={mother}
onChange={(e)=>setMother(e.target.value)}
/>

<input
className="bg-slate-800 border border-white/20 p-2 rounded w-full"
placeholder="Parent Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

<input
className="bg-slate-800 border border-white/20 p-2 rounded w-full"
placeholder="Parent Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<div>
<label>Student Photo</label>
<input type="file" onChange={(e)=>setPhoto(e.target.files?.[0])}/>
</div>

<div>
<label>Aadhar Card</label>
<input type="file" onChange={(e)=>setAadhar(e.target.files?.[0])}/>
</div>

<div>
<label>Medical Report</label>
<input type="file" onChange={(e)=>setMedical(e.target.files?.[0])}/>
</div>

<div>
<label>Transfer Certificate</label>
<input type="file" onChange={(e)=>setTc(e.target.files?.[0])}/>
</div>

<div className="flex gap-4 mt-6">

<button
className="bg-purple-600 px-4 py-2 rounded"
onClick={createStudent}
>
Create
</button>

<button
className="bg-green-600 px-4 py-2 rounded"
onClick={updateStudent}
>
Save
</button>

<button
className="bg-red-600 px-4 py-2 rounded"
onClick={deleteStudent}
>
Delete
</button>

</div>

</div>

</div>

)

}