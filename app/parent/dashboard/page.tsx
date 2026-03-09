"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentDashboard(){

  const [student,setStudent] = useState<any>(null)

  async function loadStudent(){

    const { data:user } = await supabase.auth.getUser()

    const phone = user.user?.phone

    if(!phone) return

    const { data } =
      await supabase
      .from("students")
      .select("*")
      .eq("parent_phone",phone)
      .single()

    setStudent(data)

  }

  useEffect(()=>{
    loadStudent()
  },[])

  if(!student){
    return <p className="p-10 text-white">Loading...</p>
  }

  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Parent Dashboard
      </h1>

      <div className="bg-white/10 p-6 rounded-xl mb-6">

        <p>Student: {student.name}</p>
        <p>Class: {student.class}</p>
        <p>Roll: {student.roll_number}</p>

      </div>

    </div>

  )

}