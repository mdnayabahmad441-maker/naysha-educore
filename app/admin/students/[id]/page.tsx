"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

export default function StudentProfile(){

const { id } = useParams()

const [tab,setTab] = useState("profile")

const [student,setStudent] = useState<any>(null)
const [parent,setParent] = useState<any>(null)
const [documents,setDocuments] = useState<any[]>([])
const [attendance,setAttendance] = useState<any[]>([])
const [payments,setPayments] = useState<any[]>([])

useEffect(()=>{

const load = async()=>{

/* STUDENT */

const { data:studentData } = await supabase
.from("students")
.select("*")
.eq("id",id)
.single()

setStudent(studentData)

/* PARENTS */

const { data:parentData } = await supabase
.from("parents")
.select("*")
.eq("student_id",id)
.single()

setParent(parentData)

/* DOCUMENTS */

const { data:docData } = await supabase
.from("student_documents")
.select("*")
.eq("student_id",id)

setDocuments(docData || [])

/* ATTENDANCE */

const { data:attData } = await supabase
.from("attendance")
.select("*")
.eq("student_id",id)

setAttendance(attData || [])

/* PAYMENTS */

const { data:payData } = await supabase
.from("payments")
.select("*")
.eq("student_id",id)

setPayments(payData || [])

}

load()

},[])

if(!student) return <div className="p-10 text-white">Loading...</div>

return(

<div className="p-10 text-white max-w-5xl mx-auto">

<h1 className="text-2xl mb-6">
{student.name}
</h1>

{/* PHOTO */}

{student.photo_url && (
<img
src={student.photo_url}
className="w-32 h-32 rounded mb-6"
/>
)}

{/* TABS */}

<div className="flex gap-4 mb-8">

<button onClick={()=>setTab("profile")}>Profile</button>

<button onClick={()=>setTab("attendance")}>Attendance</button>

<button onClick={()=>setTab("payments")}>Payments</button>

<button onClick={()=>setTab("documents")}>Documents</button>

<button onClick={()=>setTab("reportcards")}>Report Cards</button>

</div>


{/* PROFILE TAB */}

{tab==="profile" && (

<div>

<h2 className="text-xl mb-4">Student Details</h2>

<p>Name: {student.name}</p>

<p>Admission No: {student.admission_no}</p>

<h2 className="text-xl mt-6 mb-4">Parents</h2>

<p>Father: {parent?.father_name}</p>

<p>Mother: {parent?.mother_name}</p>

<p>Phone: {parent?.phone}</p>

<p>Email: {parent?.email}</p>

</div>

)}


{/* ATTENDANCE TAB */}

{tab==="attendance" && (

<div>

<h2 className="text-xl mb-4">Attendance</h2>

<table className="w-full border border-white/20">

<thead>
<tr>
<th className="border p-2">Date</th>
<th className="border p-2">Status</th>
</tr>
</thead>

<tbody>

{attendance.map(a=>(
<tr key={a.id}>
<td className="border p-2">{a.date}</td>
<td className="border p-2">{a.status}</td>
</tr>
))}

</tbody>

</table>

</div>

)}


{/* PAYMENTS TAB */}

{tab==="payments" && (

<div>

<h2 className="text-xl mb-4">Payment History</h2>

<table className="w-full border border-white/20">

<thead>
<tr>
<th className="border p-2">Date</th>
<th className="border p-2">Amount</th>
</tr>
</thead>

<tbody>

{payments.map(p=>(
<tr key={p.id}>
<td className="border p-2">{p.date}</td>
<td className="border p-2">₹{p.amount}</td>
</tr>
))}

</tbody>

</table>

</div>

)}


{/* DOCUMENTS TAB */}

{tab==="documents" && (

<div>

<h2 className="text-xl mb-4">Documents</h2>

{documents.map(d=>(
<div key={d.id} className="mb-2">

<a
href={d.file_url}
target="_blank"
className="text-blue-400"
>

{d.document_type}

</a>

</div>
))}

</div>

)}


{/* REPORT CARD TAB */}

{tab==="reportcards" && (

<div>

<h2 className="text-xl mb-4">
Report Cards
</h2>

<p>No report cards generated yet</p>

</div>

)}

</div>

)

}