"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AdminDashboard(){

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [fees,setFees] = useState(0)

  useEffect(()=>{
    loadDashboard()
  },[])


  async function loadDashboard(){

    const { data:userData } =
      await supabase.auth.getUser()

    const userId = userData.user?.id

    if(!userId) return


    // GET SCHOOL ID

    const { data:user } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(!user) return

    const schoolId = user.school_id


    // COUNT STUDENTS

    const { data:studentsData } =
      await supabase
        .from("students")
        .select("id")
        .eq("school_id",schoolId)

    setStudents(studentsData?.length || 0)


    // COUNT TEACHERS

    const { data:teachersData } =
      await supabase
        .from("teachers")
        .select("id")
        .eq("school_id",schoolId)

    setTeachers(teachersData?.length || 0)


    // TOTAL FEES

    const { data:feesData } =
      await supabase
        .from("fees")
        .select("total")
        .eq("school_id",schoolId)

    let totalFees = 0

    feesData?.forEach((f:any)=>{
      totalFees += Number(f.total || 0)
    })

    setFees(totalFees)

  }


  return(

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Dashboard Overview
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Total Students
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {students}
          </h2>

        </div>


        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Teachers
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {teachers}
          </h2>

        </div>


        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Fees Collected
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            ₹{fees.toLocaleString()}
          </h2>

        </div>

      </div>

    </div>

  )

}