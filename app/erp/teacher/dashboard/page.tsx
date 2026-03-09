"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function TeacherDashboard(){

  const [teacher,setTeacher] = useState<any>(null)
  const [school,setSchool] = useState<any>(null)
  const [students,setStudents] = useState(0)
  const [menuOpen,setMenuOpen] = useState(false)

  async function loadDashboard(){

    const { data:userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if(!userId) return

    const { data:user } =
      await supabase
      .from("users")
      .select("*")
      .eq("id",userId)
      .single()

    if(!user) return

    const schoolId = user.school_id

    const { data:schoolData } =
      await supabase
      .from("schools")
      .select("name")
      .eq("id",schoolId)
      .single()

    setSchool(schoolData)

    const { data:teacherData } =
      await supabase
      .from("teachers")
      .select("*")
      .eq("school_id",schoolId)
      .limit(1)
      .single()

    setTeacher(teacherData)

    const { data:studentsData } =
      await supabase
      .from("students")
      .select("*")
      .eq("school_id",schoolId)

    setStudents(studentsData?.length || 0)

  }

  useEffect(()=>{
    loadDashboard()
  },[])


  return(

    <div className="flex min-h-screen bg-[#020617] text-white">


      {/* SIDEBAR */}

      <div className={`bg-gradient-to-b from-blue-700 to-purple-700 p-6 w-64 space-y-6 fixed md:relative h-full z-50 transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}`}>

        <h2 className="text-xl font-bold text-cyan-300">
          Teacher Panel
        </h2>

        <nav className="space-y-4 text-gray-200">

          <Link href="/erp/teacher/dashboard">Dashboard</Link>
          <Link href="/erp/teacher/students">My Students</Link>
          <Link href="/erp/teacher/attendance">Attendance</Link>
          <Link href="/erp/teacher/marks">Enter Marks</Link>
          <Link href="/erp/teacher/results">Results</Link>

        </nav>

      </div>


      {/* CONTENT */}

      <div className="flex-1 p-6 md:p-10 ml-0 md:ml-0">


        {/* MOBILE MENU BUTTON */}

        <button
          onClick={()=>setMenuOpen(!menuOpen)}
          className="md:hidden mb-6 bg-white/10 px-4 py-2 rounded"
        >
          ☰ Menu
        </button>


        {/* HEADER */}

        <h1 className="text-4xl font-bold mb-2">
          Welcome
        </h1>

        <p className="text-gray-400 mb-10">
          {school?.name} • Teacher Dashboard
        </p>


        {/* STATS */}

        <div className="grid md:grid-cols-3 gap-6">


          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              My Subject
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {teacher?.subject || "Not Assigned"}
            </h2>

          </div>


          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              Classes Today
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              0
            </h2>

          </div>


          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              Students Assigned
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {students}
            </h2>

          </div>


        </div>

      </div>

    </div>

  )

}