"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Card from "@/components/ui/Card"

export default function DashboardPage() {

  const router = useRouter()

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [classes,setClasses] = useState(0)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    const loadDashboard = async () => {

      try {

        const { data:sessionData } = await supabase.auth.getSession()

        if(!sessionData.session){
          router.replace("/login")
          return
        }

        const userId = sessionData.session.user.id

        const { data:user } = await supabase
          .from("users")
          .select("school_id")
          .eq("id",userId)
          .single()

        if(!user){
          router.replace("/login")
          return
        }

        const schoolId = user.school_id

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

      } catch (error) {
        console.error("Dashboard load error:", error)
      } finally {
        setLoading(false)
      }

    }

    loadDashboard()

  },[router])


  if(loading){
    return(
      <div className="flex items-center justify-center h-[60vh] text-white text-lg">
        Loading Dashboard...
      </div>
    )
  }


  return(

    <div className="p-6 md:p-10 text-white space-y-10">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Welcome back, Admin 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Here’s what’s happening in your school today
          </p>
        </div>
      </div>


      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Total Students</p>
            <span>🎓</span>
          </div>
          <p className="text-3xl font-bold mt-3">{students}</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-900/20 border border-purple-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Teachers</p>
            <span>👨‍🏫</span>
          </div>
          <p className="text-3xl font-bold mt-3">{teachers}</p>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-900/20 border border-green-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Classes</p>
            <span>🏫</span>
          </div>
          <p className="text-3xl font-bold mt-3">{classes}</p>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-900/20 border border-yellow-500/20">
          <div className="flex justify-between">
            <p className="text-sm text-gray-400">Attendance</p>
            <span>📊</span>
          </div>
          <p className="text-3xl font-bold mt-3">--</p>
        </Card>

      </div>


      {/* LOWER SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ATTENDANCE */}
        <Card className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Today's Attendance</h2>

          {[91, 87, 95, 78].map((val, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm text-gray-400 mb-1">
                <span>Class {i+1}</span>
                <span>{val}%</span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    val > 90 ? "bg-green-400" :
                    val > 80 ? "bg-yellow-400" :
                    "bg-red-400"
                  }`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}

        </Card>


        {/* EVENTS */}
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

    </div>
  )
}