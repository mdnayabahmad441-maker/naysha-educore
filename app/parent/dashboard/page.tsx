"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentDashboard(){

  const [student,setStudent] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  async function loadStudent(){

    const { data: { user } } = await supabase.auth.getUser()

    const email = user?.email

    if(!email){
      setLoading(false)
      return
    }

    const { data, error } =
      await supabase
      .from("students")
      .select("*")
      .eq("parent_email", email)
      .single()

    if(!error){
      setStudent(data)
    }

    setLoading(false)

  }

  useEffect(()=>{
    loadStudent()
  },[])

  if(loading){
    return <p className="p-10 text-white">Loading...</p>
  }

  if(!student){
    return (
      <div className="p-10 text-white">
        <h1 className="text-2xl font-bold">
          No student linked to this parent account
        </h1>
      </div>
    )
  }

  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Parent Dashboard
      </h1>

      <div className="bg-white/10 p-6 rounded-xl mb-6">

        <p className="text-lg">
          Student: <span className="font-semibold">{student.name}</span>
        </p>

        <p>
          Class: {student.class}
        </p>

        <p>
          Roll: {student.roll_number}
        </p>

      </div>

    </div>

  )

}