"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Card from "@/components/ui/Card"
import { getSchoolId } from "@/lib/school"

// 🔥 CHART
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
          .select("present,total")
          .eq("school_id", schoolId)
          .eq("date", today)

        let percent = 0

        if(att && att.length){
          const totalPresent = att.reduce((sum,a)=>sum + (a.present || 0),0)
          const total = att.reduce((sum,a)=>sum + (a.total || 0),0)
          percent = total ? Math.round((totalPresent/total)*100) : 0
        }

        setAttendance(percent)

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

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card>
          <p className="text-gray-400 text-sm">Students</p>
          <p className="text-3xl font-bold mt-2">{students}</p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm">Teachers</p>
          <p className="text-3xl font-bold mt-2">{teachers}</p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm">Classes</p>
          <p className="text-3xl font-bold mt-2">{classes}</p>
        </Card>

        <Card>
          <p className="text-gray-400 text-sm">Attendance</p>
          <p className="text-3xl font-bold mt-2">{attendance}%</p>
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

        <Card className="bg-red-500/10 border border-red-500/20">
          <p className="text-sm text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-red-400 mt-2">
            ₹{pending.toLocaleString()}
          </p>
        </Card>

      </div>

      {/* 📊 CHART */}
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