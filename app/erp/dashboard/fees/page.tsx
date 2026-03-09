"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function FeesPage(){

const [students,setStudents] = useState<any[]>([])
const [studentId,setStudentId] = useState("")
const [studentName,setStudentName] = useState("")
const [schoolId,setSchoolId] = useState("")

const [tuition,setTuition] = useState(0)
const [exam,setExam] = useState(0)
const [hostel,setHostel] = useState(0)
const [misc,setMisc] = useState(0)
const [other,setOther] = useState(0)

const [paidAmount,setPaidAmount] = useState(0)
const [status,setStatus] = useState("Paid")

const total =
tuition + exam + hostel + misc + other


/* -------------------------------- */
/* GET SCHOOL */
/* -------------------------------- */

async function getSchool(){

const {data:userData} =
await supabase.auth.getUser()

const userId = userData.user?.id

const {data} =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(data){
setSchoolId(data.school_id)
loadStudents(data.school_id)
}

}


/* -------------------------------- */
/* LOAD STUDENTS */
/* -------------------------------- */

async function loadStudents(id:string){

const {data} =
await supabase
.from("students")
.select("*")
.eq("school_id",id)

if(data){
setStudents(data)
}

}


/* -------------------------------- */
/* GENERATE INVOICE */
/* -------------------------------- */

async function generateInvoice(){

if(!studentId){
alert("Select student")
return
}

const {error} =
await supabase
.from("fees")
.insert({

student_id:studentId,
student_name:studentName,
school_id:schoolId,

tuition_fee:tuition,
exam_fee:exam,
hostel_fee:hostel,
misc_fee:misc,
other_fee:other,

total:total,
paid_amount:paidAmount,
status:status

})

if(error){
alert(error.message)
return
}

alert("Invoice Generated")

setTuition(0)
setExam(0)
setHostel(0)
setMisc(0)
setOther(0)
setPaidAmount(0)

}


/* -------------------------------- */
/* INIT */
/* -------------------------------- */

useEffect(()=>{
getSchool()
},[])



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Fee Invoice
</h1>


<div className="bg-white/10 p-8 rounded-xl w-[420px] space-y-4">

{/* CLASS */}
<select
className="w-full p-3 rounded bg-slate-800"
>

<option>01</option>

</select>


{/* STUDENT */}
<select
className="w-full p-3 rounded bg-slate-800"
onChange={(e)=>{

const id = e.target.value
setStudentId(id)

const s = students.find(x=>x.id===id)
if(s) setStudentName(s.name)

}}
>

<option>Select Student</option>

{students.map((s)=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}

</select>


{/* TUITION */}

<input
type="number"
placeholder="Tuition Fee"
className="w-full p-3 rounded bg-slate-800"
value={tuition}
onChange={(e)=>setTuition(Number(e.target.value))}
/>


{/* EXAM */}

<input
type="number"
placeholder="Exam Fee"
className="w-full p-3 rounded bg-slate-800"
value={exam}
onChange={(e)=>setExam(Number(e.target.value))}
/>


{/* HOSTEL */}

<input
type="number"
placeholder="Hostel Fee"
className="w-full p-3 rounded bg-slate-800"
value={hostel}
onChange={(e)=>setHostel(Number(e.target.value))}
/>


{/* MISC */}

<input
type="number"
placeholder="Misc Fee"
className="w-full p-3 rounded bg-slate-800"
value={misc}
onChange={(e)=>setMisc(Number(e.target.value))}
/>


{/* OTHER */}

<input
type="number"
placeholder="Other Fee"
className="w-full p-3 rounded bg-slate-800"
value={other}
onChange={(e)=>setOther(Number(e.target.value))}
/>


{/* TOTAL */}

<h2 className="text-xl font-bold">
Total: ₹{total}
</h2>


{/* PAID AMOUNT */}

<input
type="number"
placeholder="Paid Amount"
className="w-full p-3 rounded bg-slate-800"
value={paidAmount}
onChange={(e)=>setPaidAmount(Number(e.target.value))}
/>


{/* STATUS */}

<select
className="w-full p-3 rounded bg-slate-800"
value={status}
onChange={(e)=>setStatus(e.target.value)}
>

<option>Paid</option>
<option>Partial</option>
<option>Pending</option>

</select>


{/* BUTTON */}

<button
onClick={generateInvoice}
className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>

Generate Invoice

</button>


</div>

</div>

)

}