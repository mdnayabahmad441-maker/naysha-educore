"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function StudentProfile() {

const params = useParams()

const [student,setStudent] = useState<any>(null)
const [attendance,setAttendance] = useState<any[]>([])
const [fees,setFees] = useState<any[]>([])
const [results,setResults] = useState<any[]>([])
const [activity,setActivity] = useState<any[]>([])

const [photo,setPhoto] = useState<File | null>(null)
const [document,setDocument] = useState<File | null>(null)
const [docType,setDocType] = useState("")

const [editMode,setEditMode] = useState(false)
const [tab,setTab] = useState("profile")

async function loadStudent(){

const {data} = await supabase
.from("students")
.select("*")
.eq("id",params.id)
.single()

if(data){
setStudent(data)
}

}

async function loadAttendance(){

const {data} = await supabase
.from("attendance")
.select("*")
.eq("student_id",params.id)

if(data){
setAttendance(data)

const events = data.map((a:any)=>({
type:"attendance",
date:a.date,
text:`Attendance marked ${a.status}`
}))

setActivity(prev => [...prev,...events])

}

}

async function loadFees(){

const {data} = await supabase
.from("fees")
.select("*")
.eq("student_id",params.id)

if(data){
setFees(data)

const events = data.map((f:any)=>({
type:"fee",
date:f.paid_date,
text:`Fee paid ₹${f.total}`
}))

setActivity(prev => [...prev,...events])

}

}

async function loadResults(){

const {data} = await supabase
.from("results")
.select("*")
.eq("student_id",params.id)

if(data){
setResults(data)

const events = data.map((r:any)=>({
type:"result",
date:new Date(),
text:`Result added ${r.subject} (${r.marks})`
}))

setActivity(prev => [...prev,...events])

}

}

async function uploadPhoto(){

if(!photo) return

const fileName = Date.now()+"-"+photo.name

const {error} = await supabase.storage
.from("student-photos")
.upload(fileName,photo)

if(error){
alert("Upload failed")
return
}

const url = supabase.storage
.from("student-photos")
.getPublicUrl(fileName).data.publicUrl

await supabase
.from("students")
.update({photo_url:url})
.eq("id",params.id)

alert("Photo uploaded")

loadStudent()

}

async function uploadDocument(){

if(!document) return

const fileName = Date.now()+"-"+document.name

const {error} = await supabase.storage
.from("student-documents")
.upload(fileName,document)

if(error){
alert("Upload failed")
return
}

const url = supabase.storage
.from("student-documents")
.getPublicUrl(fileName).data.publicUrl

await supabase
.from("student_documents")
.insert({

student_id:params.id,
document_type:docType,
file_url:url

})

alert("Document uploaded")

}

async function saveStudent(){

await supabase
.from("students")
.update(student)
.eq("id",params.id)

setEditMode(false)

alert("Student Updated")

loadStudent()

}

async function transferStudent(){

await supabase
.from("students")
.update({status:"transferred"})
.eq("id",params.id)

alert("Student transferred")

}

useEffect(()=>{

loadStudent()
loadAttendance()
loadFees()
loadResults()

},[])

if(!student){
return <p className="p-10">Loading...</p>
}

const sortedActivity=[...activity].sort(
(a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()
)

return(

<div className="p-10 text-white">

{/* HEADER */}

<div className="bg-white/10 p-8 rounded-xl mb-8 flex items-center gap-6">

{student.photo_url ? (

<img
src={student.photo_url}
className="w-28 h-28 rounded object-cover"
/>

) : (

<div className="w-28 h-28 bg-slate-700 rounded flex items-center justify-center">
No Photo
</div>

)}

<div>

<h1 className="text-2xl font-bold">
{student.name}
</h1>

<p className="text-gray-300">
Class {student.class} • Roll {student.roll_number}
</p>

<p className="text-sm mt-2">
Father: {student.father_name || "—"}
</p>

<p className="text-sm">
Phone: {student.parent_phone || "—"}
</p>

</div>

</div>

{/* TABS */}

<div className="flex gap-4 mb-6">

<button onClick={()=>setTab("profile")} className={`px-4 py-2 rounded ${tab==="profile" ? "bg-blue-600" : "bg-slate-700"}`}>Profile</button>

<button onClick={()=>setTab("attendance")} className={`px-4 py-2 rounded ${tab==="attendance" ? "bg-blue-600" : "bg-slate-700"}`}>Attendance</button>

<button onClick={()=>setTab("fees")} className={`px-4 py-2 rounded ${tab==="fees" ? "bg-blue-600" : "bg-slate-700"}`}>Fees</button>

<button onClick={()=>setTab("results")} className={`px-4 py-2 rounded ${tab==="results" ? "bg-blue-600" : "bg-slate-700"}`}>Results</button>

<button onClick={()=>setTab("activity")} className={`px-4 py-2 rounded ${tab==="activity" ? "bg-blue-600" : "bg-slate-700"}`}>Activity</button>

</div>

{/* PROFILE */}

{tab==="profile" && (

<div className="space-y-6">

{/* PHOTO */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">Upload Student Photo</h2>

<input type="file" onChange={(e)=>setPhoto(e.target.files?.[0] || null)} />

<button
onClick={uploadPhoto}
className="ml-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Upload Photo
</button>

</div>

{/* PERSONAL */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">Personal Details</h2>

{editMode ? (

<div className="space-y-3">

<input className="w-full p-2 rounded bg-slate-800" value={student.name||""} onChange={(e)=>setStudent({...student,name:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.class||""} onChange={(e)=>setStudent({...student,class:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.roll_number||""} onChange={(e)=>setStudent({...student,roll_number:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.address||""} onChange={(e)=>setStudent({...student,address:e.target.value})}/>

</div>

) : (

<div>

<p>Name: {student.name}</p>
<p>Class: {student.class}</p>
<p>Roll: {student.roll_number}</p>
<p>Address: {student.address}</p>

</div>

)}

</div>

{/* PARENT */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">Parent Details</h2>

{editMode ? (

<div className="space-y-3">

<input className="w-full p-2 rounded bg-slate-800" value={student.father_name||""} onChange={(e)=>setStudent({...student,father_name:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.mother_name||""} onChange={(e)=>setStudent({...student,mother_name:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.parent_phone||""} onChange={(e)=>setStudent({...student,parent_phone:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.parent_email||""} onChange={(e)=>setStudent({...student,parent_email:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.parent_aadhar||""} onChange={(e)=>setStudent({...student,parent_aadhar:e.target.value})}/>

</div>

) : (

<div>

<p>Father: {student.father_name}</p>
<p>Mother: {student.mother_name}</p>
<p>Phone: {student.parent_phone}</p>
<p>Email: {student.parent_email}</p>
<p>Parent Aadhar: {student.parent_aadhar}</p>

</div>

)}

</div>

{/* STUDENT ID */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">Student Identity</h2>

{editMode ? (

<div className="space-y-3">

<input className="w-full p-2 rounded bg-slate-800" value={student.student_aadhar||""} onChange={(e)=>setStudent({...student,student_aadhar:e.target.value})}/>

<input className="w-full p-2 rounded bg-slate-800" value={student.blood_group||""} onChange={(e)=>setStudent({...student,blood_group:e.target.value})}/>

</div>

) : (

<div>

<p>Student Aadhar: {student.student_aadhar}</p>
<p>Blood Group: {student.blood_group}</p>

</div>

)}

</div>

{/* DOCUMENT UPLOAD */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">Upload Student Document</h2>

<select className="p-2 rounded bg-slate-800 mr-3" onChange={(e)=>setDocType(e.target.value)}>

<option>Select Document</option>
<option value="aadhar">Aadhar Card</option>
<option value="blood">Blood Report</option>
<option value="birth">Birth Certificate</option>
<option value="tc">Transfer Certificate</option>

</select>

<input type="file" onChange={(e)=>setDocument(e.target.files?.[0] || null)} />

<button
onClick={uploadDocument}
className="ml-3 px-4 py-2 bg-purple-600 rounded"
>
Upload Document
</button>

</div>

{/* ACTIONS */}

<div className="bg-white/10 p-6 rounded-xl">

{editMode ? (

<button onClick={saveStudent} className="px-4 py-2 bg-green-600 rounded mr-3">
Save
</button>

) : (

<button onClick={()=>setEditMode(true)} className="px-4 py-2 bg-blue-600 rounded mr-3">
Edit Details
</button>

)}

<button onClick={transferStudent} className="px-4 py-2 bg-red-500 rounded">
Transfer Student
</button>

</div>

</div>

)}

</div>

)

}