"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

export default function StudentPage(){

const [studentId,setStudentId] = useState<any>(null)
const [schoolId,setSchoolId] = useState<string | null>(null)

const [name,setName] = useState("")
const [father,setFather] = useState("")
const [mother,setMother] = useState("")
const [phone,setPhone] = useState("")
const [email,setEmail] = useState("")

const [studentType,setStudentType] = useState("day_scholar")
const [classId,setClassId] = useState("")
const [roll,setRoll] = useState("")

const [classes,setClasses] = useState<any[]>([])
const [academicYear,setAcademicYear] = useState<any>(null)

const [photo,setPhoto] = useState<any>(null)
const [aadhar,setAadhar] = useState<any>(null)
const [medical,setMedical] = useState<any>(null)
const [tc,setTc] = useState<any>(null)

/* INIT */
useEffect(()=>{
  getSchoolId().then(setSchoolId)
  getActiveAcademicYear().then(setAcademicYear)
},[])

/* LOAD CLASSES */
useEffect(()=>{
  if(!schoolId) return

  supabase.from("classes")
    .select("*")
    .eq("school_id",schoolId)
    .then(({data})=>setClasses(data || []))
},[schoolId])

/* FILE VALIDATION */
const validateFile = (file:any)=>{
  if(!file) return true

  const allowed = [
    "image/png",
    "image/jpeg",
    "application/pdf"
  ]

  if(!allowed.includes(file.type)){
    alert("Only PNG, JPG, PDF allowed")
    return false
  }

  return true
}

/* FILE UPLOAD */
const uploadFile = async(file:any,path:string)=>{
  if(!file) return null

  if(!validateFile(file)) return null

  const { data,error } = await supabase.storage
    .from("student-files")
    .upload(path,file,{upsert:true})

  if(error){
    console.log(error)
    return null
  }

  const { data:url } = supabase.storage
    .from("student-files")
    .getPublicUrl(data.path)

  return url.publicUrl
}

/* CREATE */
const createStudent = async()=>{

if(!schoolId){
  alert("School not loaded")
  return
}

if(!classId){
  alert("Select class")
  return
}

const { data:student } = await supabase
.from("students")
.insert({
name,
school_id:schoolId,
student_type: studentType,
class_id: classId,
roll_number: roll
})
.select()
.single()

if(!student) return

setStudentId(student.id)

/* ✅ ENROLLMENT (CRITICAL FIX) */
await supabase.from("student_enrollments").insert({
  student_id: student.id,
  school_id: schoolId,
  class_id: classId,
  academic_year_id: academicYear?.id,
  roll_number: roll
})

/* PHOTO */
const photoUrl = await uploadFile(photo,`photos/${student.id}`)
if(photoUrl){
await supabase.from("students").update({photo:photoUrl}).eq("id",student.id)
}

/* PARENTS */
await supabase.from("parents").insert({
student_id:student.id,
school_id:schoolId,
father_name:father,
mother_name:mother,
phone,
email
})

/* DOCUMENTS */
const uploadDoc = async(file:any,type:string)=>{
  const url = await uploadFile(file,`documents/${student.id}/${type}`)
  if(url){
    await supabase.from("student_documents").insert({
      student_id:student.id,
      document_type:type,
      file_url:url
    })
  }
}

await uploadDoc(aadhar,"aadhar")
await uploadDoc(medical,"medical")
await uploadDoc(tc,"transfer_certificate")

alert("Student Created ✅")
}

/* UPDATE */
const updateStudent = async()=>{
if(!studentId) return

await supabase.from("students").update({
name,
student_type: studentType,
class_id: classId,
roll_number: roll
}).eq("id",studentId)

await supabase.from("parents").update({
father_name:father,
mother_name:mother,
phone,
email
}).eq("student_id",studentId)

alert("Student Updated")
}

/* DELETE */
const deleteStudent = async()=>{
if(!studentId) return

await supabase.from("students").delete().eq("id",studentId)

alert("Student Deleted")

setName("")
setFather("")
setMother("")
setPhone("")
setEmail("")
setStudentId(null)
}

return(

<div className="p-6 md:p-10 text-white max-w-3xl mx-auto">

<h1 className="text-2xl mb-6">Student Profile</h1>

<div className="space-y-4">

<input className="bg-[#0b1220] p-3 rounded-xl w-full"
placeholder="Student Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<select value={classId} onChange={(e)=>setClassId(e.target.value)}
className="bg-[#0b1220] p-3 rounded-xl w-full">
<option value="">Select Class</option>
{classes.map(c=>(
<option key={c.id} value={c.id}>{c.name}</option>
))}
</select>

<input className="bg-[#0b1220] p-3 rounded-xl w-full"
placeholder="Roll Number"
value={roll}
onChange={(e)=>setRoll(e.target.value)}
/>

<select value={studentType} onChange={(e)=>setStudentType(e.target.value)}
className="bg-[#0b1220] p-3 rounded-xl w-full">
<option value="day_scholar">Day Scholar</option>
<option value="day_scholar_transport">Day Scholar + Transport</option>
<option value="hosteler">Hosteler</option>
</select>

<input className="bg-[#0b1220] p-3 rounded-xl w-full" placeholder="Father Name" value={father} onChange={(e)=>setFather(e.target.value)} />
<input className="bg-[#0b1220] p-3 rounded-xl w-full" placeholder="Mother Name" value={mother} onChange={(e)=>setMother(e.target.value)} />
<input className="bg-[#0b1220] p-3 rounded-xl w-full" placeholder="Parent Phone" value={phone} onChange={(e)=>setPhone(e.target.value)} />
<input className="bg-[#0b1220] p-3 rounded-xl w-full" placeholder="Parent Email" value={email} onChange={(e)=>setEmail(e.target.value)} />

{/* FILES */}
<div>
<label>Photo (PNG/JPG)</label>
<input type="file" accept="image/png,image/jpeg" onChange={(e)=>setPhoto(e.target.files?.[0])}/>
</div>

<div>
<label>Aadhar (PDF/Image)</label>
<input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e)=>setAadhar(e.target.files?.[0])}/>
</div>

<div>
<label>Medical (PDF/Image)</label>
<input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e)=>setMedical(e.target.files?.[0])}/>
</div>

<div>
<label>Transfer Certificate (PDF/Image)</label>
<input type="file" accept="application/pdf,image/png,image/jpeg" onChange={(e)=>setTc(e.target.files?.[0])}/>
</div>

<div className="flex gap-3 mt-6">

<button className="bg-white/10 px-4 py-2 rounded-xl" onClick={createStudent}>
Create
</button>

<button className="bg-white/10 px-4 py-2 rounded-xl" onClick={updateStudent}>
Save
</button>

<button className="bg-red-500/20 px-4 py-2 rounded-xl" onClick={deleteStudent}>
Delete
</button>

</div>

</div>

</div>
)
}