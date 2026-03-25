"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole" // ✅ ADDED

export default function AdminDashboard(){

const router = useRouter()

const [role,setRole] = useState("") // ✅ ADDED

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
const roleData = await getUserRole() // ✅ ADDED

setRole(roleData?.role || "")

if(!schoolId) return

/* SCHOOL */

const { data:school } = await supabase
.from("schools")
.select("name")
.eq("id",schoolId)
.single()

if(school){
setSchoolName(school.name)
}

/* COUNTS */

const { count:studentCount } = await supabase
.from("students")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setStudents(studentCount || 0)

const { count:teacherCount } = await supabase
.from("teachers")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setTeachers(teacherCount || 0)

const { count:classCount } = await supabase
.from("classes")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setClasses(classCount || 0)

/* FEES (ADMIN ONLY) */
if(roleData?.role !== "teacher"){
const { data:payments } = await supabase
.from("payments")
.select("amount")
.eq("school_id",schoolId)

const total = payments?.reduce((sum:any,p:any)=>sum+p.amount,0) || 0
setFees(total)
}

/* RECENT STUDENTS */

const { data:studentsList } = await supabase
.from("students")
.select("id,name")
.eq("school_id",schoolId)
.order("created_at",{ascending:false})
.limit(5)

setRecentStudents(studentsList || [])

/* RECENT PAYMENTS (ADMIN ONLY) */

if(roleData?.role !== "teacher"){
const { data:paymentsList } = await supabase
.from("payments")
.select("id,amount,date")
.eq("school_id",schoolId)
.order("date",{ascending:false})
.limit(5)

setRecentPayments(paymentsList || [])
}

}

loadDashboard()

},[])

return(

<div className="p-6 md:p-10 text-white max-w-7xl mx-auto">

{/* HEADER */}

<h1 className="text-2xl md:text-3xl font-bold mb-2">
{role === "teacher" ? "Teacher Dashboard" : `${schoolName} Dashboard`}
</h1>

<p className="text-gray-400 mb-10">
Welcome to your school ERP dashboard
</p>


{/* STATS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">

<div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[110px] flex flex-col items-center justify-center text-center">
<p className="text-gray-400 text-sm">Students</p>
<h2 className="text-2xl md:text-3xl font-bold">{students}</h2>
</div>

{/* TEACHERS (HIDE FOR TEACHER ROLE) */}
{role !== "teacher" && (
<div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[110px] flex flex-col items-center justify-center text-center">
<p className="text-gray-400 text-sm">Teachers</p>
<h2 className="text-2xl md:text-3xl font-bold">{teachers}</h2>
</div>
)}

<div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[110px] flex flex-col items-center justify-center text-center">
<p className="text-gray-400 text-sm">Classes</p>
<h2 className="text-2xl md:text-3xl font-bold">{classes}</h2>
</div>

{/* FEES (ADMIN ONLY) */}
{role !== "teacher" && (
<div className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[110px] flex flex-col items-center justify-center text-center">
<p className="text-gray-400 text-sm">Fees Collected</p>
<h2 className="text-2xl md:text-3xl font-bold break-words">₹{fees}</h2>
</div>
)}

</div>


{/* QUICK ACTIONS */}

<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">

<button
onClick={()=>router.push("/admin/students/create")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Add Student
</button>

{/* ADMIN ONLY */}
{role !== "teacher" && (
<button
onClick={()=>router.push("/admin/teachers/add")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Add Teacher
</button>
)}

<button
onClick={()=>router.push("/admin/classes")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Manage Classes
</button>

{/* ADMIN ONLY */}
{role !== "teacher" && (
<button
onClick={()=>router.push("/admin/fees")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Collect Fees
</button>
)}

{/* TEACHER ONLY */}
{role === "teacher" && (
<>
<button
onClick={()=>router.push("/admin/exams/marks")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Enter Marks
</button>

<button
onClick={()=>router.push("/admin/exams/create")}
className="bg-white/10 backdrop-blur border border-white/10 rounded-xl min-h-[90px] flex items-center justify-center text-center hover:bg-white/20 transition"
>
Create Exam
</button>
</>
)}

</div>


{/* LOWER SECTION */}

<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">

{/* RECENT STUDENTS */}

<div className="bg-white/10 backdrop-blur border border-white/10 p-6 rounded-xl">

<h2 className="text-lg md:text-xl mb-4">
Recent Students
</h2>

<div className="space-y-3">

{recentStudents.map(s=>(

<div
key={s.id}
className="flex justify-between items-center border-b border-white/10 pb-2"
>

<p className="truncate">{s.name}</p>

{/* 🔥 BLOCK PROFILE FOR TEACHER */}
{role !== "teacher" && (
<button
className="text-blue-400 text-sm"
onClick={()=>router.push(`/admin/students/${s.id}`)}
>
View
</button>
)}

</div>

))}

</div>

</div>


{/* RECENT PAYMENTS (ADMIN ONLY) */}

{role !== "teacher" && (
<div className="bg-white/10 backdrop-blur border border-white/10 p-6 rounded-xl">

<h2 className="text-lg md:text-xl mb-4">
Recent Payments
</h2>

<div className="space-y-3">

{recentPayments.map(p=>(

<div
key={p.id}
className="flex justify-between border-b border-white/10 pb-2"
>

<p>₹{p.amount}</p>

<p className="text-gray-400 text-sm truncate">
{p.date}
</p>

</div>

))}

</div>

</div>
)}

</div>

</div>

)

}