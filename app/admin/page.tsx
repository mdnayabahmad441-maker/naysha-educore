"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {

const router = useRouter()

const [schoolName,setSchoolName] = useState("")
const [students,setStudents] = useState(0)
const [teachers,setTeachers] = useState(0)
const [classes,setClasses] = useState(0)
const [fees,setFees] = useState(0)

const [recentStudents,setRecentStudents] = useState<any[]>([])
const [recentPayments,setRecentPayments] = useState<any[]>([])

useEffect(()=>{

const loadDashboard = async()=>{

const schoolId = await getSchoolId()

if(!schoolId) return

/* SCHOOL NAME */

const { data:school } = await supabase
.from("schools")
.select("name")
.eq("id",schoolId)
.single()

if(school){
setSchoolName(school.name)
}

/* STUDENT COUNT */

const { count:studentCount } = await supabase
.from("students")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setStudents(studentCount || 0)

/* TEACHER COUNT */

const { count:teacherCount } = await supabase
.from("teachers")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setTeachers(teacherCount || 0)

/* CLASS COUNT */

const { count:classCount } = await supabase
.from("classes")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setClasses(classCount || 0)

/* FEES */

const { data:payments } = await supabase
.from("payments")
.select("amount")
.eq("school_id",schoolId)

const total = payments?.reduce((sum:any,p:any)=>sum+p.amount,0) || 0

setFees(total)

/* RECENT STUDENTS */

const { data:studentsList } = await supabase
.from("students")
.select("id,name")
.eq("school_id",schoolId)
.order("created_at",{ascending:false})
.limit(5)

setRecentStudents(studentsList || [])

/* RECENT PAYMENTS */

const { data:paymentsList } = await supabase
.from("payments")
.select("id,amount,date")
.eq("school_id",schoolId)
.order("date",{ascending:false})
.limit(5)

setRecentPayments(paymentsList || [])

}

loadDashboard()

},[])

return(

<div className="p-10 text-white max-w-7xl mx-auto">

{/* HEADER */}

<h1 className="text-3xl font-bold mb-2">
{schoolName} Dashboard
</h1>

<p className="text-gray-400 mb-10">
Welcome to your school ERP dashboard
</p>


{/* STATS */}

<div className="grid md:grid-cols-4 gap-6 mb-10">

<div className="bg-white/10 p-6 rounded-xl">
<p className="text-gray-400 text-sm">Students</p>
<h2 className="text-3xl font-bold mt-2">{students}</h2>
</div>

<div className="bg-white/10 p-6 rounded-xl">
<p className="text-gray-400 text-sm">Teachers</p>
<h2 className="text-3xl font-bold mt-2">{teachers}</h2>
</div>

<div className="bg-white/10 p-6 rounded-xl">
<p className="text-gray-400 text-sm">Classes</p>
<h2 className="text-3xl font-bold mt-2">{classes}</h2>
</div>

<div className="bg-white/10 p-6 rounded-xl">
<p className="text-gray-400 text-sm">Fees Collected</p>
<h2 className="text-3xl font-bold mt-2">₹{fees}</h2>
</div>

</div>


{/* QUICK ACTIONS */}

<div className="grid md:grid-cols-4 gap-6 mb-10">

<button
className="bg-purple-600 p-4 rounded-xl"
onClick={()=>router.push("/admin/students/create")}
>
Add Student
</button>

<button
className="bg-blue-600 p-4 rounded-xl"
onClick={()=>router.push("/admin/teachers/add")}
>
Add Teacher
</button>

<button
className="bg-green-600 p-4 rounded-xl"
onClick={()=>router.push("/admin/classes")}
>
Manage Classes
</button>

<button
className="bg-yellow-600 p-4 rounded-xl"
onClick={()=>router.push("/admin/fees")}
>
Collect Fees
</button>

</div>


{/* LOWER GRID */}

<div className="grid md:grid-cols-2 gap-8">


{/* RECENT STUDENTS */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">
Recent Students
</h2>

<table className="w-full text-sm">

<tbody>

{recentStudents.map(s=>(
<tr key={s.id}>
<td className="py-2">{s.name}</td>

<td>
<button
className="text-blue-400"
onClick={()=>router.push(`/admin/students/${s.id}`)}
>
View
</button>
</td>

</tr>
))}

</tbody>

</table>

</div>


{/* RECENT PAYMENTS */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl mb-4">
Recent Payments
</h2>

<table className="w-full text-sm">

<tbody>

{recentPayments.map(p=>(
<tr key={p.id}>

<td className="py-2">
₹{p.amount}
</td>

<td>
{p.date}
</td>

</tr>
))}

</tbody>

</table>

</div>

</div>

</div>

)

}