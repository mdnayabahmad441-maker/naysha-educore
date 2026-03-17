"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function AdminDashboard() {

  const [schoolName,setSchoolName] = useState("")
  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [classes,setClasses] = useState(0)
  const [fees,setFees] = useState(0)

  useEffect(()=>{

    const loadDashboard = async () => {

      const schoolId = await getSchoolId()

      if(!schoolId) return

      /* SCHOOL NAME */

      const { data:school } = await supabase
      .from("schools")
      .select("name")
      .eq("id",schoolId)
      .single()

      if(school){
        setSchoolName(school.name)
      }

      /* STUDENTS COUNT */

      const { count:studentCount } = await supabase
      .from("students")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

      setStudents(studentCount || 0)

      /* TEACHERS COUNT */

      const { count:teacherCount } = await supabase
      .from("teachers")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

      setTeachers(teacherCount || 0)

      /* CLASSES COUNT */

      const { count:classCount } = await supabase
      .from("classes")
      .select("*",{count:"exact",head:true})
      .eq("school_id",schoolId)

      setClasses(classCount || 0)

      /* FEES TOTAL */

      const { data:payments } = await supabase
      .from("payments")
      .select("amount")
      .eq("school_id",schoolId)

      const total = payments?.reduce((sum:any,p:any)=>sum+p.amount,0) || 0

      setFees(total)

    }

    loadDashboard()

  },[])


  return (

    <div>

      {/* HEADER */}

      <h1 className="text-3xl font-bold mb-2">
        {schoolName} Dashboard
      </h1>

      <p className="text-gray-400 mb-10">
        Welcome to your school ERP dashboard
      </p>


      {/* STATS CARDS */}

      <div className="grid md:grid-cols-4 gap-6">

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Students</p>
          <h2 className="text-3xl font-bold mt-2">{students}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Teachers</p>
          <h2 className="text-3xl font-bold mt-2">{teachers}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Classes</p>
          <h2 className="text-3xl font-bold mt-2">{classes}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-gray-400 text-sm">Fees Collected</p>
          <h2 className="text-3xl font-bold mt-2">₹{fees}</h2>
        </div>

      </div>

    </div>

  )
}