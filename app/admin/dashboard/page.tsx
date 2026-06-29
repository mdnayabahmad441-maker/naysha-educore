"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Card from "@/components/ui/Card"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

type AiDigest = {
  summary: string
  highlights: string[]
  alerts: string[]
}

export default function DashboardPage() {

  const router = useRouter()
  const school = useSchool()

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [classes,setClasses] = useState(0)

  const [attendance,setAttendance] = useState(0)
  const [classAttendance,setClassAttendance] = useState<any[]>([])
  const [absentCount,setAbsentCount] = useState(0)

  const [collected,setCollected] = useState(0)
  const [pending,setPending] = useState(0)

  const [chartData,setChartData] = useState<any[]>([])

  const [admissionEnquiries, setAdmissionEnquiries] = useState<any[]>([])

  const [year,setYear] = useState<any>(null)
  const [today,setToday] = useState("")

  const [loading,setLoading] = useState(true)

  const [aiDigest, setAiDigest] = useState<AiDigest | null>(null)
  const [digestLoading, setDigestLoading] = useState(false)
  const [digestError, setDigestError] = useState("")

  type AttendanceRow = {
    status: string
    class_id: string | null
  }

  type SchoolClass = {
    id: string
    name: string
  }

  // ✅ DATE
  useEffect(()=>{
    const d = new Date()
    setToday(
      d.toLocaleDateString("en-IN",{
        weekday:"long",
        day:"numeric",
        month:"long",
        year:"numeric"
      })
    )
  },[])

  useEffect(()=>{

    const loadDashboard = async () => {

      try {

        const schoolId = await getSchoolId()
        if(!schoolId){
          router.replace("/login")
          return
        }

        const academicYear = await getActiveAcademicYear()
        if(!academicYear){
          alert("No active academic year")
          return
        }

        setYear(academicYear)

        // ================= STUDENTS =================
        const { count:studentsCount } = await supabase
          .from("student_enrollments")
          .select("*",{ count:"exact", head:true })
          .eq("school_id",schoolId)
          .eq("academic_year_id", academicYear.id)

        const { count:teachersCount } = await supabase
          .from("teachers")
          .select("*",{ count:"exact", head:true })
          .eq("school_id",schoolId)

        const { count:classesCount } = await supabase
          .from("classes")
          .select("*",{ count:"exact", head:true })
          .eq("school_id",schoolId)

        setStudents(studentsCount || 0)
        setTeachers(teachersCount || 0)
        setClasses(classesCount || 0)

        // ================= ATTENDANCE =================
        const todayISO = new Date().toISOString().split("T")[0]

        const [{ data: att }, { data: classRows }] = await Promise.all([
          supabase
            .from("attendance")
            .select("status,class_id")
            .eq("school_id", schoolId)
            .eq("date", todayISO),

          supabase
            .from("classes")
            .select("id,name")
            .eq("school_id", schoolId)
        ])

        const classMapById = new Map(
          ((classRows as SchoolClass[] | null) ?? []).map((item) => [item.id, item.name])
        )

        const classMap:any = {}
        let totalPresent = 0
        let total = 0

        ;((att as AttendanceRow[] | null) ?? []).forEach((a) => {
          const classId = a.class_id || "unknown"

          if(!classMap[classId]){
            classMap[classId] = {
              name: a.class_id ? classMapById.get(a.class_id) || "Class" : "Class",
              present: 0,
              total: 0
            }
          }

          classMap[classId].total++

          if(a.status === "present"){
            classMap[classId].present++
            totalPresent++
          }

          total++
        })

        const formatted = Object.values(classMap).map((c:any)=>({
          name: c.name,
          percent: c.total ? Math.round((c.present / c.total) * 100) : 0
        }))

        const overall = total
          ? Math.round((totalPresent / total) * 100)
          : 0

        setAttendance(overall)
        setClassAttendance(formatted)
        setAbsentCount(total - totalPresent)

        // ================= FEES =================
        const { data: fees } = await supabase
          .from("fees")
          .select("amount,status,created_at,academic_year_id")
          .eq("school_id", schoolId)
          .eq("academic_year_id", academicYear.id)

        let paid = 0
        let due = 0

        const monthlyMap:any = {}

        fees?.forEach(f=>{
          if(f.status === "paid") paid += f.amount || 0
          else due += f.amount || 0

          const m = new Date(f.created_at).toLocaleString("default",{ month:"short" })
          monthlyMap[m] = (monthlyMap[m] || 0) + (f.amount || 0)
        })

        setCollected(paid)
        setPending(due)

        const chart = Object.keys(monthlyMap).map(m=>({
          month:m,
          amount:monthlyMap[m]
        }))

        setChartData(chart)

        // ================= ADMISSION ENQUIRIES =================
        const { data: enquiries } = await supabase
          .from("admission_enquiries")
          .select("*")
          .eq("school_id", schoolId)
          .order("created_at", { ascending: false })
          .limit(5) // Show only recent 5

        setAdmissionEnquiries(enquiries || [])

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }

    }

    loadDashboard()

  },[router])

  const fetchAiDigest = async () => {
    const schoolId = await getSchoolId()
    if (!schoolId) return

    setDigestLoading(true)
    setDigestError("")

    try {
      const newEnquiriesCount = admissionEnquiries.filter(e => e.status === "new").length

      const res = await apiFetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "dashboard_digest",
          schoolId,
          schoolName: school?.name || "School",
          stats: {
            students,
            teachers,
            classes,
            attendance,
            collected,
            pending,
            newEnquiries: newEnquiriesCount,
            absentCount
          }
        })
      })

      const json = await res.json()
      if (!res.ok || !json?.data) throw new Error(json?.error || "AI failed")
      setAiDigest(json.data as AiDigest)
    } catch (err) {
      setDigestError(err instanceof Error ? err.message : "Failed to load AI digest")
    } finally {
      setDigestLoading(false)
    }
  }

  if(loading){
    return (
      <div className="flex items-center justify-center h-[60vh] text-white">
        Loading dashboard...
      </div>
    )
  }

  return(

    <div className="space-y-8 text-white sm:space-y-10">

      {/* 🔥 HEADER (SaaS STYLE) */}
      <div className="space-y-2">

        <p className="text-sm text-gray-400">
          Academic Year {year?.name || ""}
        </p>

        <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
          Welcome back, Admin 👋
        </h1>

        <p className="text-sm text-gray-400">
          {today}
        </p>

      </div>

      {/* AI DAILY DIGEST */}
      <Card className="border border-cyan-500/20 bg-cyan-500/5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 text-lg">✦</span>
            <h2 className="font-semibold text-cyan-100">AI Daily Digest</h2>
          </div>
          <button
            onClick={fetchAiDigest}
            disabled={digestLoading}
            className="w-full rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50 sm:w-auto"
          >
            {digestLoading ? "Analysing..." : aiDigest ? "Refresh" : "Generate Digest"}
          </button>
        </div>

        {digestError && (
          <p className="text-xs text-red-400">{digestError}</p>
        )}

        {!aiDigest && !digestLoading && (
          <p className="text-sm text-gray-400">
            Click &quot;Generate Digest&quot; to get an AI-powered summary of today&apos;s school activity and action items.
          </p>
        )}

        {digestLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 bg-white/10 rounded w-3/4" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        )}

        {aiDigest && !digestLoading && (
          <div className="space-y-4">
            <p className="text-sm text-gray-200 leading-relaxed">{aiDigest.summary}</p>

            {aiDigest.alerts.length > 0 && (
              <div className="rounded-xl border border-red-400/20 bg-red-500/5 p-3 space-y-1">
                <p className="text-xs font-semibold text-red-300 uppercase tracking-wide">Alerts</p>
                {aiDigest.alerts.map((alert, i) => (
                  <p key={i} className="text-sm text-red-200">• {alert}</p>
                ))}
              </div>
            )}

            <div className="space-y-1">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Action Items</p>
              {aiDigest.highlights.map((item, i) => (
                <p key={i} className="text-sm text-gray-300">• {item}</p>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 🔥 CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="hover:scale-[1.02] transition">
          <p className="text-gray-400 text-sm">Students</p>
          <p className="text-3xl font-bold mt-2">{students}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition">
          <p className="text-gray-400 text-sm">Teachers</p>
          <p className="text-3xl font-bold mt-2">{teachers}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition">
          <p className="text-gray-400 text-sm">Classes</p>
          <p className="text-3xl font-bold mt-2">{classes}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition">
          <p className="text-gray-400 text-sm">Attendance</p>
          <p className="text-3xl font-bold mt-2">{attendance}%</p>
        </Card>

      </div>

      {/* 🔥 MAIN GRID */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* 📊 ATTENDANCE */}
        <Card className="lg:col-span-2 space-y-4">

          <h2 className="text-lg font-semibold">Today&apos;s Attendance</h2>

          {classAttendance.length === 0 ? (
            <p className="text-sm text-gray-400">No attendance marked today</p>
          ) : (
            classAttendance.map((c,i)=>(
              <div key={i}>

                <div className="flex justify-between text-sm text-gray-400">
                  <span>{c.name}</span>
                  <span>{c.percent}%</span>
                </div>

                <div className="h-2 bg-white/10 rounded-full mt-1">
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
            ))
          )}

        </Card>

        {/* 📅 EVENTS (READY FOR DB) */}
        <Card className="space-y-4">

          <h2 className="text-lg font-semibold">Upcoming Events</h2>

          <p className="text-sm text-gray-400">
            Connect events table to show here
          </p>

        </Card>

      </div>

      {/* � ADMISSION ENQUIRIES */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Admission Enquiries</h2>
          <button
            onClick={() => router.push('/admin/admission-enquiry')}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All →
          </button>
        </div>

        {admissionEnquiries.length === 0 ? (
          <p className="text-sm text-gray-400">No enquiries yet</p>
        ) : (
          <div className="space-y-3">
            {admissionEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="flex flex-col gap-3 rounded-lg bg-white/5 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">{enquiry.student_name}</span>
                    <span className="text-xs text-gray-400">({enquiry.father_name})</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Class: {enquiry.class_wanted} • {enquiry.phone}
                  </div>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    enquiry.status === 'new'
                      ? 'bg-green-500/20 text-green-400'
                      : enquiry.status === 'contacted'
                      ? 'bg-blue-500/20 text-blue-400'
                      : enquiry.status === 'admitted'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {enquiry.status}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(enquiry.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* �💰 FEES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <Card className="bg-green-500/10 border border-green-500/20">
          <p className="text-sm text-gray-400">Collected</p>
          <p className="text-2xl font-bold text-green-400 mt-2">
            ₹{collected.toLocaleString()}
          </p>
        </Card>

        <Card className="bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400 mt-2">
            ₹{pending.toLocaleString()}
          </p>
        </Card>

      </div>

      {/* 📈 CHART */}
      <Card className="p-6">

        <h2 className="mb-4 font-semibold">Monthly Fee Collection</h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" stroke="#aaa"/>
            <YAxis stroke="#aaa"/>
            <Tooltip />
            <Bar dataKey="amount" fill="#3b82f6" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>

      </Card>

    </div>
  )
}
