"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentDashboard(){

  const [student,setStudent] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  async function loadStudent(){

    const { data:{ user } } = await supabase.auth.getUser()

    const email = user?.email

    if(!email){
      setLoading(false)
      return
    }

    const { data } =
      await supabase
        .from("students")
        .select("*")
        .eq("parent_email",email)
        .single()

    setStudent(data)
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
        No student linked to this parent account
      </div>
    )
  }

  return(

    <div className="p-6 text-white">

      {/* Header */}

      <h1 className="text-3xl font-bold mb-6">
        Parent Dashboard
      </h1>

      {/* Student Info Card */}

      <div className="bg-white/10 p-6 rounded-xl mb-6">

        <h2 className="text-xl font-semibold mb-2">
          {student.name}
        </h2>

        <p>Class: {student.class}</p>
        <p>Roll: {student.roll_number}</p>

      </div>

      {/* Quick Stats */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        <div className="bg-white/10 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Attendance</p>
          <p className="text-2xl font-bold">
            92%
          </p>
        </div>

        <div className="bg-white/10 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Fees Due</p>
          <p className="text-2xl font-bold">
            ₹1200
          </p>
        </div>

        <div className="bg-white/10 p-5 rounded-xl">
          <p className="text-gray-400 text-sm">Latest Result</p>
          <p className="text-2xl font-bold">
            A Grade
          </p>
        </div>

      </div>

      {/* Quick Actions */}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <button className="bg-blue-600 p-4 rounded-xl">
          Attendance
        </button>

        <button className="bg-green-600 p-4 rounded-xl">
          Fees
        </button>

        <button className="bg-purple-600 p-4 rounded-xl">
          Results
        </button>

        <button className="bg-orange-600 p-4 rounded-xl">
          Report Card
        </button>

      </div>

    </div>

  )

}