"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function TeacherDashboard(){

  const pathname = usePathname()

  const [teacher,setTeacher] = useState<any>(null)
  const [school,setSchool] = useState<any>(null)
  const [students,setStudents] = useState(0)
  const [menuOpen,setMenuOpen] = useState(false)

  async function loadDashboard(){

    const { data:{ user } } = await supabase.auth.getUser()

    if(!user){
      window.location.href = "/login"
      return
    }

    const userId = user.id


    // GET USER ROLE + SCHOOL

    const { data:userData } =
      await supabase
      .from("users")
      .select("school_id,role,email")
      .eq("id",userId)
      .single()

    if(!userData){
      window.location.href = "/login"
      return
    }


    // ROLE PROTECTION

    if(userData.role !== "teacher"){
      alert("Access denied")
      window.location.href = "/login"
      return
    }


    const schoolId = userData.school_id


    // LOAD SCHOOL

    const { data:schoolData } =
      await supabase
      .from("schools")
      .select("name")
      .eq("id",schoolId)
      .single()

    setSchool(schoolData)


    // LOAD CURRENT TEACHER

    const { data:teacherData } =
      await supabase
      .from("teachers")
      .select("*")
      .eq("email",userData.email)
      .eq("school_id",schoolId)
      .single()

    setTeacher(teacherData)


    // LOAD STUDENTS FOR TEACHER CLASS

    if(teacherData?.class){

      const { data:studentsData } =
        await supabase
        .from("students")
        .select("*")
        .eq("class",teacherData.class)
        .eq("school_id",schoolId)

      setStudents(studentsData?.length || 0)

    }

  }

  useEffect(()=>{
    loadDashboard()
  },[])


  const menu = [
    {name:"Dashboard",path:"/erp/teacher/dashboard"},
    {name:"My Students",path:"/erp/teacher/students"},
    {name:"Attendance",path:"/erp/teacher/attendance"},
    {name:"Enter Marks",path:"/erp/teacher/marks"},
    {name:"Results",path:"/erp/teacher/results"}
  ]


  return(

    <div className="flex min-h-screen bg-[#020617] text-white">


      {/* SIDEBAR */}

      <aside className={`bg-gradient-to-b from-blue-700 to-purple-700 w-64 p-6 fixed md:relative h-full transition-transform duration-300 ${menuOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}`}>

        <h2 className="text-xl font-bold text-cyan-300 mb-8">
          Teacher Panel
        </h2>

        <nav className="flex flex-col gap-3">

          {menu.map((item)=>(
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 rounded-lg transition ${
                pathname === item.path
                ? "bg-white/20 text-cyan-300"
                : "hover:bg-white/10"
              }`}
            >
              {item.name}
            </Link>
          ))}

        </nav>

      </aside>


      {/* MAIN */}

      <main className="flex-1 p-6 md:p-10">


        <button
          onClick={()=>setMenuOpen(!menuOpen)}
          className="md:hidden mb-6 bg-white/10 px-4 py-2 rounded"
        >
          ☰ Menu
        </button>


        <h1 className="text-4xl font-bold mb-2">
          Welcome {teacher?.name || ""}
        </h1>

        <p className="text-gray-400 mb-10">
          {school?.name} • Teacher Dashboard
        </p>


        {/* CARDS */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">


          <div className="bg-white/10 p-6 rounded-xl backdrop-blur hover:bg-white/20 transition">

            <p className="text-gray-400">
              My Subject
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {teacher?.subject || "Not Assigned"}
            </h2>

          </div>


          <div className="bg-white/10 p-6 rounded-xl backdrop-blur hover:bg-white/20 transition">

            <p className="text-gray-400">
              Classes Today
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              0
            </h2>

          </div>


          <div className="bg-white/10 p-6 rounded-xl backdrop-blur hover:bg-white/20 transition">

            <p className="text-gray-400">
              Students Assigned
            </p>

            <h2 className="text-2xl font-bold text-cyan-400 mt-2">
              {students}
            </h2>

          </div>

        </div>

      </main>

    </div>

  )

}