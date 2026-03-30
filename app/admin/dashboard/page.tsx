"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Card from "@/components/ui/Card"
import { getSchoolId } from "@/lib/school"

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

  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    const loadDashboard = async () => {

      try {

        const schoolId = await getSchoolId()

        if(!schoolId){
          router.replace("/login")
          return
        }

        // =========================
        // COUNTS
        // =========================
        const { count:studentsCount } = await supabase
          .from("students")
          .select("*",{ count:"exact", head:true })
          .eq("school_id",schoolId)

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

        // =========================
        // 🔥 ATTENDANCE (TODAY)
        // =========================
        const today = new Date().toISOString().split("T")[0]

        const { data: att } = await supabase
          .from("attendance")
          .select(`
            present,
            total,
            class_id,
            classes(name)
          `)
          .eq("school_id", schoolId)
          .eq("date", today)

        let totalPresent = 0
        let totalStudents = 0

        const formatted = (att || []).map((a:any) => {

          totalPresent += a.present || 0
          totalStudents += a.total || 0

          const percent = a.total
            ? Math.round((a.present / a.total) * 100)
            : 0

          return {
            name: a.classes?.name || "Class",
            percent
          }
        })

        const overall = totalStudents
          ? Math.round((totalPresent / totalStudents) * 100)
          : 0

        setAttendance(overall)
        setClassAttendance(formatted)

        // =========================
        // 💰 FEES
        // =========================
        const { data: fees } = await supabase
          .from("fees")
          .select("amount,status")
          .eq("school_id", schoolId)

        let paid = 0
        let due = 0

        fees?.forEach(f=>{
          if(f.status === "paid") paid += f.amount || 0
          else due += f.amount || 0
        })

        setCollected(paid)
        setPending(due)

        // =========================
        // 📈 MONTHLY CHART
        // =========================
        const { data: monthly } = await supabase
          .from("fees")
          .select("amount,created_at")
          .eq("school_id", schoolId)

        const map:any = {}

        monthly?.forEach(f=>{
          const m = new Date(f.created_at).toLocaleString("default",{ month:"short" })
          map[m] = (map[m] || 0) + (f.amount || 0)
        })

        const chart = Object.keys(map).map(m=>({
          month:m,
          amount:map[m]
        }))

        setChartData(chart)

      } catch (error) {
        console.error("Dashboard error:", error)
      } finally {
        setLoading(false)
      }

    }

    loadDashboard()

  },[router])

  if(loading){
    return(
      <div className="flex items-center justify-center h-[60vh] text-white">
        Loading...
      </div>
    )
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back, Admin 👋
        </h1>
        <p className="text-gray-400 text-sm">
          Real-time school insights
        </p>
      </div>

      {/* 🔥 TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Total Students</p>
            🎓
          </div>
          <p className="text-3xl font-bold mt-3">{students}</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Teachers</p>
            👨‍🏫
          </div>
          <p className="text-3xl font-bold mt-3">{teachers}</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Classes</p>
            🏫
          </div>
          <p className="text-3xl font-bold mt-3">{classes}</p>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Attendance</p>
            📊
          </div>
          <p className="text-3xl font-bold mt-3">{attendance}%</p>
        </Card>

      </div>

      {/* 🔥 LOWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 📊 ATTENDANCE */}
        <Card className="lg:col-span-2 space-y-4">

          <h2 className="text-lg font-semibold">Today's Attendance</h2>

          {classAttendance.length === 0 ? (
            <p className="text-sm text-gray-400">
              No attendance marked today
            </p>
          ) : (
            classAttendance.map((c,i)=>(
              <div key={i}>

                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>{c.name}</span>
                  <span>{c.percent}%</span>
                </div>

                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      c.percent > 90 ? "bg-green-400" :
                      c.percent > 80 ? "bg-yellow-400" :
                      "bg-red-400"
                    }`}
                    style={{ width: `${c.percent}%` }}
                  />
                </div>

              </div>
            ))
          )}

        </Card>

        {/* 📅 EVENTS */}
        <Card className="space-y-4">

          <h2 className="text-lg font-semibold">Upcoming Events</h2>

          <div className="text-sm text-gray-400 space-y-3">

            <div>
              <p className="text-white">Annual Sports Day</p>
              <span className="text-xs">10 Apr • Sports</span>
            </div>

            <div>
              <p className="text-white">Science Exhibition</p>
              <span className="text-xs">20 Apr • Academic</span>
            </div>

            <div>
              <p className="text-white">Parent Meeting</p>
              <span className="text-xs">28 Apr • Meeting</span>
            </div>

          </div>

        </Card>

      </div>

      {/* 💰 FEES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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

        <Card className="bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            ₹0
          </p>
        </Card>

      </div>

      {/* 📈 CHART */}
      <Card className="p-6">

        <h2 className="mb-4 font-semibold">Monthly Fee Collection</h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <XAxis dataKey="month" stroke="#888"/>
            <YAxis stroke="#888"/>
            <Tooltip />
            <Bar dataKey="amount" fill="#3b82f6" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>

      </Card>

    </div>
  )
}