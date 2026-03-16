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

    <div className="p-6 md:p-8 text-white">

      <h1 className="text-2xl md:text-3xl font-semibold mb-6">
        School Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <Card>
          <h2 className="text-gray-300 text-sm">Students</h2>
          <p className="text-3xl font-semibold mt-2">{students}</p>
        </Card>

        <Card>
          <h2 className="text-gray-300 text-sm">Teachers</h2>
          <p className="text-3xl font-semibold mt-2">{teachers}</p>
        </Card>

        <Card>
          <h2 className="text-gray-300 text-sm">Classes</h2>
          <p className="text-3xl font-semibold mt-2">{classes}</p>
        </Card>

        <Card>
          <h2 className="text-gray-300 text-sm">Attendance</h2>
          <p className="text-3xl font-semibold mt-2">--</p>
        </Card>

      </div>

    </div>

  )
}