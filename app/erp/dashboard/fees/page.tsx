"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function FeesPage(){

const [schoolId,setSchoolId] = useState("")

const [classes,setClasses] = useState<string[]>([])
const [selectedClass,setSelectedClass] = useState("")

const [students,setStudents] = useState<any[]>([])
const [studentId,setStudentId] = useState("")
const [studentName,setStudentName] = useState("")

const [schoolFee,setSchoolFee] = useState(0)
const [examFee,setExamFee] = useState(0)
const [hostelFee,setHostelFee] = useState(0)
const [miscFee,setMiscFee] = useState(0)
const [otherFee,setOtherFee] = useState(0)

const [paidAmount,setPaidAmount] = useState(0)

const total =
schoolFee +
examFee +
hostelFee +
miscFee +
otherFee



/* GET SCHOOL */

async function getSchool(){

const {data:userData} =
await supabase.auth.getUser()

const userId = userData.user?.id

if(!userId) return

const {data} =
await supabase
.from("users")
.select("school_id")
.eq("id",userId)
.single()

if(data){

setSchoolId(data.school_id)

loadClasses(data.school_id)

}

}



/* LOAD CLASSES */

async function loadClasses(id:string){

const {data} =
await supabase
.from("students")
.select("class")
.eq("school_id",id)

if(data){

const unique =
[...new Set(data.map((s:any)=>s.class))]

setClasses(unique)

}

}



/* LOAD STUDENTS OF CLASS */

async function loadStudents(className:string){

const {data} =
await supabase
.from("students")
.select("*")
.eq("class",className)
.eq("school_id",schoolId)

if(data){
setStudents(data)
}

}



/* INVOICE NUMBER */

function generateInvoiceNumber(){

const date = new Date()

const year = date.getFullYear()
const month = String(date.getMonth()+1).padStart(2,"0")

const random =
Math.floor(Math.random()*9000+1000)

return `INV-${year}${month}-${random}`

}



/* GENERATE INVOICE */

async function generateInvoice(){

if(!studentId){

alert("Please select student")
return

}

const invoice =
generateInvoiceNumber()

const balance =
total - paidAmount

let status = "Pending"

if(balance === 0){
status = "Paid"
}

if(balance > 0 && paidAmount > 0){
status = "Partial"
}

const {error} =
await supabase
.from("fees")
.insert({

invoice_number:invoice,

school_id:schoolId,

student_id:studentId,
student_name:studentName,
class:selectedClass,

school_fee:schoolFee,
exam_fee:examFee,
hostel_fee:hostelFee,
misc_fee:miscFee,
other_fee:otherFee,

total:total,
paid_amount:paidAmount,
balance:balance,

status:status

})

if(error){

alert(error.message)
return

}

alert("Invoice Generated")

setSchoolFee(0)
setExamFee(0)
setHostelFee(0)
setMiscFee(0)
setOtherFee(0)
setPaidAmount(0)

}



/* INIT */

useEffect(()=>{
getSchool()
},[])



return(

<div className="p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
Fee Invoice
</h1>



<div className="bg-white/10 p-8 rounded-xl w-[420px] space-y-4">



{/* CLASS SELECT */}

<div>

<p className="text-sm mb-1 text-gray-300">
Select Class
</p>

<select
className="w-full p-3 rounded bg-slate-800"
value={selectedClass}
onChange={(e)=>{

const c = e.target.value

setSelectedClass(c)

loadStudents(c)

}}
>

<option>Select Class</option>

{classes.map((c)=>(
<option key={c}>{c}</option>
))}

</select>

</div>



{/* STUDENT SELECT */}

<div>

<p className="text-sm mb-1 text-gray-300">
Select Student
</p>

<select
className="w-full p-3 rounded bg-slate-800"
onChange={(e)=>{

const id = e.target.value

setStudentId(id)

const s =
students.find(x=>x.id===id)

if(s){
setStudentName(s.name)
}

}}
>

<option>Select Student</option>

{students.map((s)=>(
<option key={s.id} value={s.id}>
{s.name}
</option>
))}

</select>

</div>



{/* SCHOOL FEE */}

<div>

<p className="text-sm mb-1 text-gray-300">
School Fee
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={schoolFee}
onChange={(e)=>setSchoolFee(Number(e.target.value))}
/>

</div>



{/* EXAM FEE */}

<div>

<p className="text-sm mb-1 text-gray-300">
Exam Fee
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={examFee}
onChange={(e)=>setExamFee(Number(e.target.value))}
/>

</div>



{/* HOSTEL FEE */}

<div>

<p className="text-sm mb-1 text-gray-300">
Hostel Fee
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={hostelFee}
onChange={(e)=>setHostelFee(Number(e.target.value))}
/>

</div>



{/* MISC FEE */}

<div>

<p className="text-sm mb-1 text-gray-300">
Misc Fee
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={miscFee}
onChange={(e)=>setMiscFee(Number(e.target.value))}
/>

</div>



{/* OTHER FEE */}

<div>

<p className="text-sm mb-1 text-gray-300">
Other Fee
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={otherFee}
onChange={(e)=>setOtherFee(Number(e.target.value))}
/>

</div>



{/* TOTAL */}

<h2 className="text-xl font-bold">
Total: ₹{total}
</h2>



{/* PAID AMOUNT */}

<div>

<p className="text-sm mb-1 text-gray-300">
Paid Amount
</p>

<input
type="number"
className="w-full p-3 rounded bg-slate-800"
value={paidAmount}
onChange={(e)=>setPaidAmount(Number(e.target.value))}
/>

</div>



{/* STATUS */}

<select
className="w-full p-3 rounded bg-slate-800"
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