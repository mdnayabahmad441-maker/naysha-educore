"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { getActiveAcademicYear } from "@/lib/academic"
import { apiFetch } from "@/lib/api-client"

import {
  BarChart,
  Bar,
  CartesianGrid,
  Cell,
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

const [,setAttendance] = useState(0)
const [classAttendance,setClassAttendance] = useState<any[]>([])
const [teacherAttendance,setTeacherAttendance] = useState({
present: 0,
late: 0,
absent: 0,
notMarked: 0,
percent: 0,
})

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

type ChatMessage = {
role: "user" | "assistant"
content: string
}

const attendanceBarColor = (percent: number) => {
if(percent >= 90) return "#10b981"
if(percent >= 75) return "#f59e0b"
return "#ef4444"
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
const totalTeachers = teacherCount || 0

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

/* TEACHER ATTENDANCE */
if(roleData?.role !== "teacher"){
const teacherAttendanceResponse = await apiFetch(`/api/admin/teacher-attendance?view=day&date=${todayISO}`)
const teacherAttendanceResult = await teacherAttendanceResponse.json().catch(() => ({}))
const teacherRecords = teacherAttendanceResponse.ok && teacherAttendanceResult.success
  ? (teacherAttendanceResult.records || [])
  : []
const teacherPresent = teacherRecords.filter((record:any)=>record.status === "present").length
const teacherLate = teacherRecords.filter((record:any)=>record.status === "late").length
const teacherAbsent = teacherRecords.filter((record:any)=>record.status === "absent").length
const teacherMarked = teacherPresent + teacherLate + teacherAbsent

setTeacherAttendance({
  present: teacherPresent,
  late: teacherLate,
  absent: teacherAbsent,
  notMarked: Math.max(totalTeachers - teacherMarked, 0),
  percent: totalTeachers ? Math.round(((teacherPresent + teacherLate) / totalTeachers) * 100) : 0,
})
}

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

const [assistantOpen,setAssistantOpen] = useState(false)
const [assistantPrompt,setAssistantPrompt] = useState("")
const [assistantSending,setAssistantSending] = useState(false)
const [assistantMessages,setAssistantMessages] = useState<ChatMessage[]>([
{
role: "assistant",
content: "Ask me about students, fees, attendance, admissions, notices, or anything you need for today."
}
])

const sendAssistantMessage = async(seed?: string)=>{
const content = (seed || assistantPrompt).trim()
if(!content || assistantSending) return

setAssistantSending(true)
setAssistantPrompt("")

const nextMessages: ChatMessage[] = [
...assistantMessages,
{ role: "user", content }
]

setAssistantMessages(nextMessages)

try{
const schoolId = await getSchoolId()

const response = await apiFetch("/api/ai/chat",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
schoolId,
schoolName: schoolName || "School",
messages: nextMessages
})
})

const result = await response.json()

if(!response.ok){
throw new Error(result?.error || "AI assistant is not available right now.")
}

setAssistantMessages((current)=>[
...current,
{ role:"assistant", content: result.message || "I could not generate a reply." }
])
}catch(error){
setAssistantMessages((current)=>[
...current,
{ role:"assistant", content: error instanceof Error ? error.message : "Failed to get AI reply." }
])
}finally{
setAssistantSending(false)
}
}

const handleAssistantKey = (event: React.KeyboardEvent<HTMLTextAreaElement>)=>{
if(event.key === "Enter" && !event.shiftKey){
event.preventDefault()
void sendAssistantMessage()
}
}

return(

<div className="mx-auto max-w-7xl space-y-4 text-white">

{/* HEADER */}
<div className="animate-fade-in flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
<div className="min-w-0">
<h1 className="text-2xl font-bold leading-tight sm:text-3xl">
{role === "teacher" ? "Teacher Dashboard" : `${schoolName} Dashboard`}
</h1>
<p className="mt-1 max-w-2xl text-sm text-gray-400">
{today} {academicYear ? `• Academic Year ${academicYear.name}` : ""}
</p>
</div>
<button
  onClick={()=>setAssistantOpen(true)}
  className="hidden items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-600/30 sm:flex sm:w-auto sm:shrink-0"
>
  <span>✦</span> Atlas
</button>
</div>

{!assistantOpen && (
<button
  type="button"
  onClick={()=>setAssistantOpen(true)}
  className="fixed right-3 z-30 flex h-10 items-center gap-1.5 rounded-full border border-cyan-300/30 bg-[linear-gradient(135deg,#2563eb,#0891b2)] px-3 text-xs font-bold text-white shadow-[0_12px_28px_rgba(8,145,178,0.3)] transition active:scale-95 sm:hidden"
  style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
  aria-label="Open Atlas"
>
  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/18 text-sm">✦</span>
  <span>Atlas</span>
</button>
)}

{assistantOpen && (
<div className="fixed inset-x-3 bottom-3 top-20 z-40 flex flex-col overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#07111f] text-white shadow-[0_22px_70px_rgba(2,8,23,0.65)] sm:bottom-auto sm:left-auto sm:right-8 sm:top-24 sm:max-h-[calc(100dvh-7rem)] sm:w-[420px]">
<div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
<div>
<p className="text-sm font-bold text-cyan-100">Atlas</p>
<p className="text-xs text-slate-400">Answers here on the dashboard</p>
</div>
<button
type="button"
onClick={()=>setAssistantOpen(false)}
className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
>
Close
</button>
</div>

<div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-4 sm:min-h-[260px]">
{assistantMessages.map((message,index)=>(
<div
key={index}
className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
message.role === "assistant"
? "mr-6 bg-white/7 text-slate-100"
: "ml-6 bg-blue-600/25 text-blue-50"
}`}
>
<p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
{message.role === "assistant" ? "Atlas" : "You"}
</p>
<p className="whitespace-pre-wrap">{message.content}</p>
</div>
))}
{assistantSending && (
<div className="mr-6 rounded-2xl bg-white/7 px-4 py-3 text-sm text-slate-400">
Thinking...
</div>
)}
</div>

<div className="border-t border-white/10 p-3">
<div className="flex gap-2">
<textarea
value={assistantPrompt}
onChange={(event)=>setAssistantPrompt(event.target.value)}
onKeyDown={handleAssistantKey}
rows={2}
placeholder="Ask here..."
className="min-h-12 flex-1 resize-none rounded-xl border border-white/10 bg-[#0b1220] p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
/>
<button
type="button"
onClick={()=>void sendAssistantMessage()}
disabled={assistantSending || !assistantPrompt.trim()}
className="self-end rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
>
Send
</button>
</div>
</div>
</div>
)}

{/* STATS */}
<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">

<div className="stat-card animate-slide-up stagger-1 rounded-xl border border-blue-500/20 bg-blue-600/20 p-4">
<p className="text-gray-400 text-sm">Students</p>
<p className="text-2xl font-bold">{students}</p>
</div>

{role !== "teacher" && (
<div className="stat-card animate-slide-up stagger-2 rounded-xl border border-purple-500/20 bg-purple-600/20 p-4">
<p className="text-gray-400 text-sm">Teachers</p>
<p className="text-2xl font-bold">{teachers}</p>
</div>
)}

<div className="stat-card animate-slide-up stagger-3 rounded-xl border border-green-500/20 bg-green-600/20 p-4">
<p className="text-gray-400 text-sm">Classes</p>
<p className="text-2xl font-bold">{classes}</p>
</div>

{role !== "teacher" && (
<div className="stat-card animate-slide-up stagger-4 rounded-xl border border-yellow-500/20 bg-yellow-600/20 p-4">
<p className="text-gray-400 text-sm">Fees</p>
<p className="text-2xl font-bold">₹{fees}</p>
</div>
)}

{role !== "teacher" && (
<div className="stat-card animate-slide-up stagger-5 rounded-xl border border-cyan-500/20 bg-cyan-600/20 p-4">
<p className="text-gray-400 text-sm">Teacher Attendance</p>
<p className="text-2xl font-bold">{teacherAttendance.percent}%</p>
<p className="mt-2 text-xs text-gray-400">
{teacherAttendance.present} present &middot; {teacherAttendance.late} late &middot; {teacherAttendance.absent} absent
</p>
</div>
)}

</div>

{/* ATTENDANCE */}
<div className="animate-slide-up stagger-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
<div className="rounded-xl border border-white/10 bg-white/5 p-4">
<div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
<div>
<h2 className="text-lg font-semibold">Today&apos;s Attendance</h2>
<p className="mt-1 text-sm text-gray-400">Class-wise percentage view for quick scanning.</p>
</div>
<span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Students</span>
</div>

{classAttendance.length === 0 ? (
<p className="py-12 text-center text-sm text-gray-400">No attendance marked today</p>
) : (
<div className="mt-3 h-44 min-w-0">
<ResponsiveContainer width="100%" height="100%">
<BarChart data={classAttendance} margin={{ top: 18, right: 8, left: -18, bottom: 6 }}>
<CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
<XAxis
dataKey="name"
stroke="var(--text-muted)"
tick={{ fill: "var(--text-muted)", fontSize: 12 }}
tickLine={false}
axisLine={{ stroke: "rgba(148,163,184,0.22)" }}
interval={0}
/>
<YAxis
domain={[0, 100]}
stroke="var(--text-muted)"
tick={{ fill: "var(--text-muted)", fontSize: 12 }}
tickFormatter={(value)=>`${value}%`}
tickLine={false}
axisLine={false}
/>
<Tooltip
cursor={{ fill: "rgba(148,163,184,0.08)" }}
contentStyle={{
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--text-main)",
}}
formatter={(value)=>[`${value}%`, "Attendance"]}
/>
<Bar dataKey="percent" radius={[6,6,0,0]} barSize={34}>
{classAttendance.map((entry:any,index:number)=>(
<Cell key={`attendance-${index}`} fill={attendanceBarColor(Number(entry.percent) || 0)} />
))}
</Bar>
</BarChart>
</ResponsiveContainer>
</div>
)}
</div>

{role !== "teacher" && (
<div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3">
<div className="flex items-start justify-between gap-3">
<div>
<h2 className="text-lg font-semibold">Teacher Attendance</h2>
<p className="mt-1 text-sm text-gray-400">Staff status for today.</p>
</div>
<button
type="button"
onClick={()=>router.push("/admin/teacher-attendance")}
className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20"
>
Manage
</button>
</div>

<div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-center">
<p className="text-sm text-gray-400">Overall Staff Attendance</p>
<p className="mt-1 text-3xl font-black text-cyan-100">{teacherAttendance.percent}%</p>
</div>

<div className="mt-2 grid grid-cols-2 gap-2">
{[
["Present", teacherAttendance.present, "text-emerald-300", "border-emerald-400/20 bg-emerald-400/10"],
["Late", teacherAttendance.late, "text-amber-300", "border-amber-400/20 bg-amber-400/10"],
["Absent", teacherAttendance.absent, "text-red-300", "border-red-400/20 bg-red-400/10"],
["Not marked", teacherAttendance.notMarked, "text-slate-300", "border-slate-400/20 bg-slate-400/10"],
].map(([label,value,color,boxClass])=>(
<div key={String(label)} className={`rounded-xl border p-2 ${boxClass}`}>
<p className="text-xs text-gray-400">{label}</p>
<p className={`mt-1 text-xl font-bold ${color}`}>{value}</p>
</div>
))}
</div>
</div>
)}
</div>

{/* QUICK ACTIONS */}
<div className="animate-slide-up stagger-4 grid grid-cols-2 gap-3 lg:grid-cols-4">

<button onClick={()=>router.push("/admin/students/create")} className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/20">Add Student</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/teachers?add=teacher")} className="rounded-xl border border-purple-400/20 bg-purple-500/10 p-3 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/20">Add Teacher</button>
)}

<button onClick={()=>router.push("/admin/classes")} className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20">Manage Classes</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/fees")} className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20">Collect Fees</button>
)}

</div>

{/* LOWER */}
<div className="animate-slide-up stagger-5 grid gap-3 lg:grid-cols-2">

<div className="rounded-xl border border-white/10 bg-white/5 p-3">
<h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Recent Students</h2>

{recentStudents.slice(0,3).map(s=>(
<div key={s.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 last:border-b-0">
<span className="min-w-0 truncate text-sm">{s.name}</span>
{role !== "teacher" && (
<button onClick={()=>router.push(`/admin/students/${s.id}`)} className="text-sm font-semibold text-blue-300">View</button>
)}
</div>
))}
</div>

{role !== "teacher" && (
<div className="rounded-xl border border-white/10 bg-white/5 p-3">
<h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Recent Payments</h2>

{recentPayments.slice(0,3).map(p=>(
<div key={p.id} className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 last:border-b-0">
<span>₹{p.amount}</span>
<span className="text-xs text-gray-400">{p.date}</span>
</div>
))}
</div>
)}

</div>

</div>
)
}
