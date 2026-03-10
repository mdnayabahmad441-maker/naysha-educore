"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function FeesPage(){

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")
const [students,setStudents] = useState<any[]>([])
const [studentId,setStudentId] = useState("")

const [tuition,setTuition] = useState("")
const [hostel,setHostel] = useState("")
const [misc,setMisc] = useState("")
const [other,setOther] = useState("")

const [total,setTotal] = useState(0)
const [schoolId,setSchoolId] = useState<string | null>(null)


useEffect(()=>{
loadSchool()
},[])


useEffect(()=>{
calculateTotal()
},[tuition,hostel,misc,other])


function calculateTotal(){

const t = Number(tuition || 0)
const h = Number(hostel || 0)
const m = Number(misc || 0)
const o = Number(other || 0)

setTotal(t+h+m+o)

}


async function loadSchool(){

const { data:userData } = await supabase.auth.getUser()

const userId = userData.user?.id

if(!userId) return

const { data:user } =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(!user) return

setSchoolId(user.school_id)

const { data } =
await supabase
.from("students")
.select("class")
.eq("school_id",user.school_id)

const uniqueClasses =
Array.from(new Set(data?.map((s:any)=>s.class)))

setClasses(uniqueClasses)

}


async function loadStudents(className:string){

setSelectedClass(className)

const { data } =
await supabase
.from("students")
.select("*")
.eq("class",className)

if(data){
setStudents(data)
}

}


async function generateInvoice(){

if(!studentId){
alert("Select student")
return
}

const invoiceNumber =
"INV-"+Math.floor(Math.random()*1000000)

const { error } =
await supabase
.from("fees")
.insert({
student_id:studentId,
school_id:schoolId,
class:selectedClass,
invoice_number:invoiceNumber,
tuition_fee:tuition,
hostel_fee:hostel,
misc_fee:misc,
other_fee:other,
total:total
})

if(error){
alert(error.message)
return
}

alert("Invoice Created")

setStudentId("")
setTuition("")
setHostel("")
setMisc("")
setOther("")

}


return(

<div>

<h1 className="text-3xl font-bold mb-8">
Fees Management
</h1>


{/* CLASS SELECT */}

<div className="bg-white/10 p-6 rounded-xl mb-8 w-[400px]">

<h2 className="text-xl mb-4">Select Class</h2>

<select
className="w-full p-2 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>loadStudents(e.target.value)}
>

<option value="">Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>

</div>



{/* STUDENT SELECT */}

{students.length > 0 && (

<div className="bg-white/10 p-6 rounded-xl mb-8 w-[400px]">

<h2 className="text-xl mb-4">Select Student</h2>

<select
className="w-full p-2 rounded bg-slate-800"
value={studentId}
onChange={(e)=>setStudentId(e.target.value)}
>

<option value="">Select Student</option>

{students.map((s)=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}

</select>

</div>

)}



{/* FEES FORM */}

<div className="bg-white/10 p-6 rounded-xl w-[400px]">

<h2 className="text-xl mb-4">
Fee Invoice
</h2>

<input
placeholder="Tuition Fee"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={tuition}
onChange={(e)=>setTuition(e.target.value)}
/>

<input
placeholder="Hostel Fee"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={hostel}
onChange={(e)=>setHostel(e.target.value)}
/>

<input
placeholder="Misc Fee"
className="w-full p-2 mb-3 rounded bg-slate-800"
value={misc}
onChange={(e)=>setMisc(e.target.value)}
/>

<input
placeholder="Other Fee"
className="w-full p-4 rounded bg-slate-800"
value={other}
onChange={(e)=>setOther(e.target.value)}
/>


<div className="mt-4 mb-4 text-xl font-bold text-cyan-400">
Total: ₹{total}
</div>


<button
onClick={generateInvoice}
className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
Generate Invoice
</button>

</div>

</div>

)

}