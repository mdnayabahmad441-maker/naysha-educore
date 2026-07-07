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

<div className="mx-auto max-w-7xl space-y-8 text-white sm:space-y-10">

{/* HEADER */}
<div className="animate-fade-in flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
  <span>✦</span> AI Assistant
</button>
</div>

<button
  type="button"
  onClick={()=>setAssistantOpen(true)}
  className="fixed right-4 top-20 z-30 flex items-center gap-2 rounded-full border border-cyan-300/30 bg-[linear-gradient(135deg,#2563eb,#0891b2)] px-4 py-2.5 text-sm font-bold text-white shadow-[0_18px_42px_rgba(8,145,178,0.35)] transition active:scale-95 sm:hidden"
  aria-label="Open AI Assistant"
>
  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/18 text-base">✦</span>
  <span>AI Assistant</span>
</button>

{assistantOpen && (
<div className="fixed inset-x-3 top-20 z-40 rounded-2xl border border-cyan-300/20 bg-[#07111f] text-white shadow-[0_22px_70px_rgba(2,8,23,0.65)] sm:left-auto sm:right-8 sm:top-24 sm:w-[420px]">
<div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
<div>
<p className="text-sm font-bold text-cyan-100">AI Assistant</p>
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

<div className="max-h-[48vh] min-h-[260px] space-y-3 overflow-y-auto p-4">
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
{message.role === "assistant" ? "AI" : "You"}
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
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">

<div className="stat-card animate-slide-up stagger-1 rounded-xl border border-blue-500/20 bg-blue-600/20 p-5 sm:p-6">
<p className="text-gray-400 text-sm">Students</p>
<p className="text-3xl font-bold">{students}</p>
</div>

{role !== "teacher" && (
<div className="stat-card animate-slide-up stagger-2 rounded-xl border border-purple-500/20 bg-purple-600/20 p-5 sm:p-6">
<p className="text-gray-400 text-sm">Teachers</p>
<p className="text-3xl font-bold">{teachers}</p>
</div>
)}

<div className="stat-card animate-slide-up stagger-3 rounded-xl border border-green-500/20 bg-green-600/20 p-5 sm:p-6">
<p className="text-gray-400 text-sm">Classes</p>
<p className="text-3xl font-bold">{classes}</p>
</div>

{role !== "teacher" && (
<div className="stat-card animate-slide-up stagger-4 rounded-xl border border-yellow-500/20 bg-yellow-600/20 p-5 sm:p-6">
<p className="text-gray-400 text-sm">Fees</p>
<p className="text-3xl font-bold">₹{fees}</p>
</div>
)}

</div>

{/* ATTENDANCE */}
<div className="animate-slide-up stagger-2 bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
<h2 className="text-lg font-semibold">Today&apos;s Attendance</h2>

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
<div className="animate-slide-up stagger-3 bg-white/5 border border-white/10 rounded-xl p-6">
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
<div className="animate-slide-up stagger-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">

<button onClick={()=>router.push("/admin/students/create")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">Add Student</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/teachers?add=teacher")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">Add Teacher</button>
)}

<button onClick={()=>router.push("/admin/classes")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">Manage Classes</button>

{role !== "teacher" && (
<button onClick={()=>router.push("/admin/fees")} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">Collect Fees</button>
)}

</div>

{/* LOWER */}
<div className="animate-slide-up stagger-5 grid md:grid-cols-2 gap-6">

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
