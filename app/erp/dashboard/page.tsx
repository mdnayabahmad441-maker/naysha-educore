"use client"

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

    // get school id

    const { data:user } =
      await supabase
      .from("users")
      .select("school_id")
      .eq("id",userId)
      .single()

    if(!user) return

    const schoolId = user.school_id


    // students count

    const { count:studentsCount } =
      await supabase
      .from("students")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

    // teachers count

    const { count:teachersCount } =
      await supabase
      .from("teachers")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

    // fees sum

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

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Dashboard Overview
      </h1>

      <div className="flex gap-8">

        <div className="bg-white/10 p-6 rounded-xl w-44 text-center">

          <p>Total Students</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            {students}
          </h2>

        </div>


        <div className="bg-white/10 p-6 rounded-xl w-44 text-center">

          <p>Teachers</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            {teachers}
          </h2>

        </div>


        <div className="bg-white/10 p-6 rounded-xl w-44 text-center">

          <p>Fees Collected</p>

          <h2 className="text-3xl font-bold text-cyan-400">
            ₹{fees}
          </h2>

        </div>

      </div>

    </div>

  )

}