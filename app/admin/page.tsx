"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { getActiveAcademicYear } from "@/lib/academic"

export default function AdminDashboard(){

const router = useRouter()

const [role,setRole] = useState("")
const [schoolName,setSchoolName] = useState("")
const [academicYear,setAcademicYear] = useState<any>(null)

const [students,setStudents] = useState(0)
const [teachers,setTeachers] = useState(0)
const [classes,setClasses] = useState(0)
const [fees,setFees] = useState(0)

const [attendance,setAttendance] = useState(0)

const [recentStudents,setRecentStudents] = useState<any[]>([])
const [recentPayments,setRecentPayments] = useState<any[]>([])

const today = new Date().toLocaleDateString(undefined,{
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
})

useEffect(()=>{

const loadDashboard = async()=>{

const schoolId = await getSchoolId()
const roleData = await getUserRole()

setRole(roleData?.role || "")

if(!schoolId) return

const year = await getActiveAcademicYear()
setAcademicYear(year)

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

/* FEES */
if(roleData?.role !== "teacher"){
const { data:payments } = await supabase
.from("payments")
.select("amount")
.eq("school_id",schoolId)

const total = payments?.reduce((sum:any,p:any)=>sum+p.amount,0) || 0
setFees(total)
}

/* ATTENDANCE TODAY */
const todayISO = new Date().toISOString().split("T")[0]

const { data:att } = await supabase
.from("attendance")
.select("status")
.eq("school_id",schoolId)
.eq("date",todayISO)

let present = 0
let total = 0

att?.forEach((a:any)=>{
total++
if(a.status === "present") present++
})

const percent = total ? Math.round((present/total)*100) : 0
setAttendance(percent)

/* RECENT STUDENTS */
const { data:studentsList } = await supabase
.from("students")
.select("id,name")
.eq("school_id",schoolId)
.order("created_at",{ascending:false})
.limit(5)

setRecentStudents(studentsList || [])

/* RECENT PAYMENTS */
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

<div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-10">

{/* 🔥 HEADER */}
<div>
<h1 className="text-3xl font-bold">
Welcome back 👋
</h1>

<p className="text-gray-400 text-sm mt-1">
{today} {academicYear ? `• Academic Year ${academicYear.name}` : ""}
</p>
</div>

{/* 🔥 STATS */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

<div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Students</p>
<p className="text-3xl font-bold mt-2">{students}</p>
</div>

{role !== "teacher" && (
<div className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Teachers</p>
<p className="text-3xl font-bold mt-2">{teachers}</p>
</div>
)}

<div className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Classes</p>
<p className="text-3xl font-bold mt-2">{classes}</p>
</div>

{role !== "teacher" && (
<div className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Fees</p>
<p className="text-3xl font-bold mt-2">₹{fees}</p>
</div>
)}

</div>

{/* 🔥 ATTENDANCE */}
<div className="bg-white/5 border border-white/10 rounded-xl p-6">

<h2 className="text-lg font-semibold mb-4">
Today's Attendance
</h2>

<div className="w-full bg-white/10 rounded-full h-3">
<div
className={`h-3 rounded-full ${
attendance > 90 ? "bg-green-400" :
attendance > 75 ? "bg-yellow-400" :
"bg-red-400"
}`}
style={{ width: `${attendance}%` }}
/>
</div>

<p className="text-sm text-gray-400 mt-2">
{attendance}% attendance today
</p>

</div>

{/* 🔥 QUICK ACTIONS */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

<button onClick={()=>router.push("/admin/students/create")}
className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
Add Student
</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/teachers/add")}
className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
Add Teacher
</button>
)}

<button onClick={()=>router.push("/admin/classes")}
className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
Manage Classes
</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/fees")}
className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
Collect Fees
</button>
)}

</div>

{/* 🔥 LOWER */}
<div className="grid md:grid-cols-2 gap-6">

{/* STUDENTS */}
<div className="bg-white/5 border border-white/10 p-6 rounded-xl">
<h2 className="text-lg mb-4">Recent Students</h2>

{recentStudents.map(s=>(
<div key={s.id} className="flex justify-between border-b border-white/10 pb-2 mb-2">
<span>{s.name}</span>
{role !== "teacher" && (
<button onClick={()=>router.push(`/admin/students/${s.id}`)}
className="text-blue-400 text-sm">View</button>
)}
</div>
))}
</div>

{/* PAYMENTS */}
{role !== "teacher" && (
<div className="bg-white/5 border border-white/10 p-6 rounded-xl">
<h2 className="text-lg mb-4">Recent Payments</h2>

{recentPayments.map(p=>(
<div key={p.id} className="flex justify-between border-b border-white/10 pb-2 mb-2">
<span>₹{p.amount}</span>
<span className="text-gray-400 text-sm">{p.date}</span>
</div>
))}
</div>
)}

</div>

</div>
)
}