"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { getActiveAcademicYear } from "@/lib/academic"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

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
const [classAttendance,setClassAttendance] = useState<any[]>([])

const [recentStudents,setRecentStudents] = useState<any[]>([])
const [recentPayments,setRecentPayments] = useState<any[]>([])

const today = new Date().toLocaleDateString(undefined,{
weekday:"long",
year:"numeric",
month:"long",
day:"numeric"
})

type AttendanceRow = {
status: string
class_id: string | null
}

type SchoolClass = {
id: string
name: string
}

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

/* ✅ FIXED STUDENT COUNT (USE ENROLLMENTS) */
const { count:studentCount } = await supabase
.from("student_enrollments")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)
.eq("academic_year_id", year?.id)

setStudents(studentCount || 0)

/* TEACHERS */
const { count:teacherCount } = await supabase
.from("teachers")
.select("*",{count:"exact",head:true})
.eq("school_id",schoolId)

setTeachers(teacherCount || 0)

/* CLASSES */
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

const totalFees = payments?.reduce((sum:any,p:any)=>sum+p.amount,0) || 0
setFees(totalFees)
}

/* 🔥 ATTENDANCE */
const todayISO = new Date().toISOString().split("T")[0]

const [{ data:att }, { data:classRows }] = await Promise.all([
supabase
  .from("attendance")
  .select("status,class_id")
  .eq("school_id",schoolId)
  .eq("date",todayISO),

supabase
  .from("classes")
  .select("id,name")
  .eq("school_id",schoolId)
])

const classNameMap = new Map(
  ((classRows as SchoolClass[] | null) ?? []).map((item)=>[item.id, item.name])
)

let totalPresent = 0
let total = 0
const map:any = {}

;((att as AttendanceRow[] | null) ?? []).forEach((a)=>{

  const classId = a.class_id || "unknown"

  if(!map[classId]){
    map[classId] = {
      name: a.class_id ? classNameMap.get(a.class_id) || "Class" : "Class",
      present: 0,
      total: 0
    }
  }

  map[classId].total++
  total++

  if(a.status === "present"){
    map[classId].present++
    totalPresent++
  }
})

const formatted = Object.values(map).map((c:any)=>({
  name: c.name,
  percent: c.total ? Math.round((c.present/c.total)*100) : 0
}))

setClassAttendance(formatted)

const overall = total ? Math.round((totalPresent/total)*100) : 0
setAttendance(overall)

/* ✅ FIXED RECENT STUDENTS (USE ENROLLMENTS) */
const { data:studentsList } = await supabase
.from("student_enrollments")
.select(`
  id,
  students(id,name)
`)
.eq("school_id",schoolId)
.eq("academic_year_id", year?.id)
.order("created_at",{ascending:false})
.limit(5)

const formattedStudents = (studentsList || []).map((s:any)=>({
  id: s.students?.id,
  name: s.students?.name
}))

setRecentStudents(formattedStudents)

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

{/* HEADER */}
<div>
<h1 className="text-3xl font-bold">
{role === "teacher" ? "Teacher Dashboard" : `${schoolName} Dashboard`}
</h1>

<p className="text-gray-400 text-sm mt-1">
{today} {academicYear ? `• Academic Year ${academicYear.name}` : ""}
</p>
</div>

{/* STATS */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

<div className="bg-blue-600/20 border border-blue-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Students</p>
<p className="text-3xl font-bold">{students}</p>
</div>

{role !== "teacher" && (
<div className="bg-purple-600/20 border border-purple-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Teachers</p>
<p className="text-3xl font-bold">{teachers}</p>
</div>
)}

<div className="bg-green-600/20 border border-green-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Classes</p>
<p className="text-3xl font-bold">{classes}</p>
</div>

{role !== "teacher" && (
<div className="bg-yellow-600/20 border border-yellow-500/20 rounded-xl p-6">
<p className="text-gray-400 text-sm">Fees</p>
<p className="text-3xl font-bold">₹{fees}</p>
</div>
)}

</div>

{/* ATTENDANCE */}
<div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
<h2 className="text-lg font-semibold">Today's Attendance</h2>

{classAttendance.map((c:any,i:number)=>(
<div key={i}>
<div className="flex justify-between text-sm text-gray-400 mb-1">
<span>{c.name}</span>
<span>{c.percent}%</span>
</div>

<div className="w-full bg-white/10 rounded-full h-2">
<div
className={`h-2 rounded-full ${
c.percent > 90 ? "bg-green-400" :
c.percent > 75 ? "bg-yellow-400" :
"bg-red-400"
}`}
style={{ width: `${c.percent}%` }}
/>
</div>
</div>
))}
</div>

{/* CHART */}
<div className="bg-white/5 border border-white/10 rounded-xl p-6">
<h2 className="mb-4 font-semibold">Attendance Overview</h2>

<ResponsiveContainer width="100%" height={250}>
<BarChart data={classAttendance}>
<XAxis dataKey="name" stroke="#888"/>
<YAxis stroke="#888"/>
<Tooltip />
<Bar dataKey="percent" fill="#3b82f6" />
</BarChart>
</ResponsiveContainer>
</div>

{/* QUICK ACTIONS */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">

<button onClick={()=>router.push("/admin/students/create")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10">Add Student</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/teachers/add")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10">Add Teacher</button>
)}

<button onClick={()=>router.push("/admin/classes")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10">Manage Classes</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/fees")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10">Collect Fees</button>
)}

</div>

{/* LOWER */}
<div className="grid md:grid-cols-2 gap-6">

<div className="bg-white/5 border border-white/10 p-6 rounded-xl">
<h2 className="text-lg mb-4">Recent Students</h2>

{recentStudents.map(s=>(
<div key={s.id} className="flex justify-between border-b border-white/10 pb-2 mb-2">
<span>{s.name}</span>
{role !== "teacher" && (
<button onClick={()=>router.push(`/admin/students/${s.id}`)} className="text-blue-400 text-sm">View</button>
)}
</div>
))}
</div>

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
