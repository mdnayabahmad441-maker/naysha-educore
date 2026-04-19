"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Card from "@/components/ui/Card"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts"

export default function DashboardPage() {

  const router = useRouter()

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [classes,setClasses] = useState(0)

  const [attendance,setAttendance] = useState(0)
  const [classAttendance,setClassAttendance] = useState<any[]>([])

  const [collected,setCollected] = useState(0)
  const [pending,setPending] = useState(0)

  const [chartData,setChartData] = useState<any[]>([])

  const [year,setYear] = useState<any>(null)
  const [today,setToday] = useState("")

  const [loading,setLoading] = useState(true)

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

      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }

    }

    loadDashboard()

  },[router])

  if(loading){
    return (
      <div className="flex items-center justify-center h-[60vh] text-white">
        Loading dashboard...
      </div>
    )
  }

  return(

    <div className="p-6 md:p-10 space-y-10 text-white">

      {/* 🔥 HEADER (SaaS STYLE) */}
      <div className="space-y-2">

        <p className="text-sm text-gray-400">
          Academic Year {year?.name || ""}
        </p>

        <h1 className="text-3xl font-bold">
          Welcome back, Admin 👋
        </h1>

        <p className="text-sm text-gray-400">
          {today}
        </p>

      </div>

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

          <h2 className="text-lg font-semibold">Today's Attendance</h2>

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

      {/* 💰 FEES */}
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
