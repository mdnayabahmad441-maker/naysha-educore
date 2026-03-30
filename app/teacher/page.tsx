"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TeacherDashboard(){

  const [loading,setLoading] = useState(true)
  const [teacher,setTeacher] = useState<any>(null)

  useEffect(()=>{

    const load = async()=>{

      const { data } = await supabase.auth.getUser()

      if(!data.user){
        window.location.href = "/login"
        return
      }

      const { data: teacherData } = await supabase
        .from("teachers")
        .select("*")
        .eq("auth_id", data.user.id)
        .single()

      if(!teacherData){
        alert("Teacher not found")
        return
      }

      setTeacher(teacherData)
      setLoading(false)
    }

    load()

  },[])

  if(loading){
    return <div className="p-10 text-white">Loading...</div>
  }

  return(
    <div className="p-10 text-white space-y-4">

      <h1 className="text-2xl font-bold">
        Welcome {teacher.name} 👋
      </h1>

      <p className="text-gray-400">
        Subject: {teacher.subject || "-"}
      </p>

    </div>
  )
}