"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getUserRole } from "@/lib/getUserRole"

export default function TeacherDashboard(){

  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    const check = async()=>{

      const { data } = await supabase.auth.getSession()

      if(!data.session){
        window.location.href = "/login"
        return
      }

      const roleData = await getUserRole()

      if(roleData?.role !== "teacher"){
        window.location.href = "/unauthorized"
        return
      }

      setLoading(false)
    }

    check()

  },[])

  if(loading){
    return (
      <div className="p-10 text-white">
        Loading Teacher Panel...
      </div>
    )
  }

  return(
    <div className="p-10 text-white">

      <h1 className="text-2xl font-bold mb-4">
        Teacher Dashboard
      </h1>

      <p className="text-gray-400">
        Welcome to teacher panel
      </p>

    </div>
  )
}