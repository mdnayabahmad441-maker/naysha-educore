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

    <div className="p-6 md:p-10 text-white space-y-8">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>

        <p className="text-gray-400 mt-2 text-sm">
          Monitor your school performance in real-time
        </p>
      </div>


      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card className="hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-gray-400 text-sm">Students</h2>
            <span className="text-blue-400 text-lg">👨‍🎓</span>
          </div>
          <p className="text-3xl font-bold mt-3">{students}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-gray-400 text-sm">Teachers</h2>
            <span className="text-purple-400 text-lg">👨‍🏫</span>
          </div>
          <p className="text-3xl font-bold mt-3">{teachers}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-gray-400 text-sm">Classes</h2>
            <span className="text-green-400 text-lg">🏫</span>
          </div>
          <p className="text-3xl font-bold mt-3">{classes}</p>
        </Card>

        <Card className="hover:scale-[1.02] transition-all duration-300">
          <div className="flex justify-between items-center">
            <h2 className="text-gray-400 text-sm">Attendance</h2>
            <span className="text-yellow-400 text-lg">📊</span>
          </div>
          <p className="text-3xl font-bold mt-3">--</p>
        </Card>

      </div>

    </div>

  )
}