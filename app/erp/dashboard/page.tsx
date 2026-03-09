"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function DashboardPage(){

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [fees,setFees] = useState(0)

  async function loadStats(){

    const { data:userData } =
      await supabase.auth.getUser()

    const userId = userData.user?.id

    if(!userId) return

    const { data:user } =
      await supabase
      .from("users")
      .select("school_id")
      .eq("id",userId)
      .single()

    if(!user) return

    const schoolId = user.school_id

    const { count:studentsCount } =
      await supabase
      .from("students")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

    const { count:teachersCount } =
      await supabase
      .from("teachers")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

    const { data:feesData } =
      await supabase
      .from("fees")
      .select("amount")
      .eq("school_id",schoolId)

    const totalFees =
      feesData?.reduce((sum:any,f:any)=>sum+Number(f.amount),0) || 0

    setStudents(studentsCount || 0)
    setTeachers(teachersCount || 0)
    setFees(totalFees)
  }

  useEffect(()=>{
    loadStats()
  },[])

  return(

    <div className="flex min-h-screen text-white bg-[#020617]">

      {/* SIDEBAR */}

      <div className="w-64 bg-gradient-to-b from-indigo-700 to-purple-800 p-6">

        <h1 className="text-2xl font-bold mb-10">
          NaySha EduCore
        </h1>

        <nav className="flex flex-col gap-6">

          <Link href="/erp/dashboard">Dashboard</Link>

          <Link href="/erp/dashboard/students">
            Students
          </Link>

          <Link href="/erp/dashboard/teachers">
            Teachers
          </Link>

          <Link href="/erp/dashboard/attendance">
            Attendance
          </Link>

          <Link href="/erp/dashboard/fees">
            Fees
          </Link>

          <Link href="/erp/dashboard/exams">
            Exams
          </Link>

          <Link href="/erp/dashboard/reports">
            Reports
          </Link>

          <Link href="/erp/dashboard/settings">
            Settings
          </Link>

        </nav>

      </div>


      {/* MAIN DASHBOARD */}

      <div className="flex-1 p-10">

        <h1 className="text-4xl font-bold mb-10">
          Dashboard Overview
        </h1>


        <div className="flex gap-10">

          {/* STUDENTS */}

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-52 text-center">

            <p className="text-gray-300">
              Total Students
            </p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              {students}
            </h2>

          </div>


          {/* TEACHERS */}

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-52 text-center">

            <p className="text-gray-300">
              Teachers
            </p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              {teachers}
            </h2>

          </div>


          {/* FEES */}

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl w-52 text-center">

            <p className="text-gray-300">
              Fees Collected
            </p>

            <h2 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹{fees}
            </h2>

          </div>

        </div>

      </div>

    </div>

  )

}