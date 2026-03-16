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

      const { data:sessionData } = await supabase.auth.getSession()

      if(!sessionData.session){
        router.replace("/login")
        return
      }

      const userId = sessionData.session.user.id

      // get school id
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

      // count students
      const { count:studentsCount } = await supabase
        .from("students")
        .select("*",{ count:"exact", head:true })
        .eq("school_id",schoolId)

      // count teachers
      const { count:teachersCount } = await supabase
        .from("teachers")
        .select("*",{ count:"exact", head:true })
        .eq("school_id",schoolId)

      // count classes
      const { count:classesCount } = await supabase
        .from("classes")
        .select("*",{ count:"exact", head:true })
        .eq("school_id",schoolId)

      setStudents(studentsCount || 0)
      setTeachers(teachersCount || 0)
      setClasses(classesCount || 0)

      setLoading(false)
    }

    loadDashboard()

  },[])

  if(loading){
    return(
      <div className="text-white p-10">
        Loading Dashboard...
      </div>
    )
  }

  return(

    <div className="p-8 text-white">

      <h1 className="text-2xl mb-6">
        School Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">

        <Card>
          <h2 className="text-lg">Students</h2>
          <p className="text-3xl mt-2">{students}</p>
        </Card>

        <Card>
          <h2 className="text-lg">Teachers</h2>
          <p className="text-3xl mt-2">{teachers}</p>
        </Card>

        <Card>
          <h2 className="text-lg">Classes</h2>
          <p className="text-3xl mt-2">{classes}</p>
        </Card>

        <Card>
          <h2 className="text-lg">Attendance</h2>
          <p className="text-3xl mt-2">--</p>
        </Card>

      </div>

    </div>
  )
}