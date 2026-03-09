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

      <aside className={`bg-gradient-to-b from-blue-700 to-purple-700 w-64 p-6 space-y-8 fixed md:relative h-full transition-transform ${menuOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}`}>

        <h2 className="text-xl font-bold text-cyan-300">
          Teacher Panel
        </h2>

        <nav className="flex flex-col space-y-4">

          <Link
            href="/erp/teacher/dashboard"
            className="hover:text-cyan-300 transition"
          >
            Dashboard
          </Link>

          <Link
            href="/erp/teacher/students"
            className="hover:text-cyan-300 transition"
          >
            My Students
          </Link>

          <Link
            href="/erp/teacher/attendance"
            className="hover:text-cyan-300 transition"
          >
            Attendance
          </Link>

          <Link
            href="/erp/teacher/marks"
            className="hover:text-cyan-300 transition"
          >
            Enter Marks
          </Link>

          <Link
            href="/erp/teacher/results"
            className="hover:text-cyan-300 transition"
          >
            Results
          </Link>

        </nav>

      </aside>

      {/* MAIN */}

      <main className="flex-1 p-6 md:p-10">

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

        {/* CARDS */}

        <div className="grid md:grid-cols-3 gap-6">

          <div className="bg-white/10 p-6 rounded-xl">
            <p className="text-gray-400">My Subject</p>
            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {teacher?.subject || "Not Assigned"}
            </h2>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <p className="text-gray-400">Classes Today</p>
            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              0
            </h2>
          </div>

          <div className="bg-white/10 p-6 rounded-xl">
            <p className="text-gray-400">Students Assigned</p>
            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {students}
            </h2>
          </div>

        </div>

      </main>

    </div>

  )

}