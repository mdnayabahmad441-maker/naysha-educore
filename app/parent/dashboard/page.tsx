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

    <div className="min-h-screen bg-black text-white pb-20">

      {/* Header */}

      <div className="p-6">

        <h1 className="text-2xl font-bold">
          Parent Dashboard
        </h1>

      </div>


      {/* Student Card */}

      <div className="px-6 mb-6">

        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="text-xl font-semibold mb-2">
            {student.name}
          </h2>

          <p className="text-gray-300">
            Class: {student.class}
          </p>

          <p className="text-gray-300">
            Roll: {student.roll_number}
          </p>

        </div>

      </div>


      {/* Stats */}

      <div className="grid grid-cols-2 gap-4 px-6 mb-6">

        <div className="bg-white/10 p-4 rounded-xl">

          <p className="text-sm text-gray-400">
            Attendance
          </p>

          <p className="text-xl font-bold">
            92%
          </p>

        </div>

        <div className="bg-white/10 p-4 rounded-xl">

          <p className="text-sm text-gray-400">
            Fees Due
          </p>

          <p className="text-xl font-bold">
            ₹1200
          </p>

        </div>

        <div className="bg-white/10 p-4 rounded-xl">

          <p className="text-sm text-gray-400">
            Latest Result
          </p>

          <p className="text-xl font-bold">
            A Grade
          </p>

        </div>

        <div className="bg-white/10 p-4 rounded-xl">

          <p className="text-sm text-gray-400">
            Notifications
          </p>

          <p className="text-xl font-bold">
            2
          </p>

        </div>

      </div>


      {/* Quick Actions */}

      <div className="grid grid-cols-2 gap-4 px-6">

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


      {/* Bottom Navigation */}

      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">

        <div className="grid grid-cols-5 text-center text-sm">

          <button className="p-3">Home</button>

          <button className="p-3">
            Attendance
          </button>

          <button className="p-3">
            Fees
          </button>

          <button className="p-3">
            Results
          </button>

          <button className="p-3">
            Profile
          </button>

        </div>

      </div>

    </div>

  )

}