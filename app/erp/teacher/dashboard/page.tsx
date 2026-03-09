"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function TeacherDashboard(){

  const router = useRouter()

  const [loading,setLoading] = useState(true)
  const [teacher,setTeacher] = useState<any>(null)

  useEffect(()=>{
    loadTeacher()
  },[])

  async function loadTeacher(){

    const { data } = await supabase.auth.getSession()

    if(!data.session){
      router.push("/erp/login")
      return
    }

    const userId = data.session.user.id

    const { data:user } =
      await supabase
      .from("users")
      .select("role")
      .eq("id",userId)
      .single()

    if(user?.role !== "teacher"){
      router.push("/erp/dashboard")
      return
    }

    const { data:teacherData } =
      await supabase
      .from("teachers")
      .select("*")
      .eq("email",data.session.user.email)
      .single()

    if(teacherData){
      setTeacher(teacherData)
    }

    setLoading(false)

  }

  if(loading){
    return(
      <div className="p-10 text-white">
        Loading teacher dashboard...
      </div>
    )
  }

  return(

    <div className="min-h-screen flex bg-slate-950 text-white">

      {/* SIDEBAR */}

      <aside className="w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-6">

        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          Teacher Panel
        </h1>

        <nav className="space-y-4">

          <Link
          href="/erp/teacher/dashboard"
          className="block px-4 py-2 rounded hover:bg-white/10">
            Dashboard
          </Link>

          <Link
          href="/erp/dashboard/students"
          className="block px-4 py-2 rounded hover:bg-white/10">
            My Students
          </Link>

          <Link
          href="/erp/dashboard/attendance"
          className="block px-4 py-2 rounded hover:bg-white/10">
            Attendance
          </Link>

          <Link
          href="/erp/dashboard/exams/marks"
          className="block px-4 py-2 rounded hover:bg-white/10">
            Enter Marks
          </Link>

          <Link
          href="/erp/dashboard/exams/results"
          className="block px-4 py-2 rounded hover:bg-white/10">
            Results
          </Link>

        </nav>

      </aside>



      {/* MAIN AREA */}

      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          Welcome {teacher?.name}
        </h2>

        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              My Subject
            </p>

            <h3 className="text-2xl text-cyan-400 mt-2">
              {teacher?.subject}
            </h3>

          </div>


          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              Classes Today
            </p>

            <h3 className="text-2xl text-cyan-400 mt-2">
              5
            </h3>

          </div>


          <div className="bg-white/10 p-6 rounded-xl">

            <p className="text-gray-400">
              Students
            </p>

            <h3 className="text-2xl text-cyan-400 mt-2">
              120
            </h3>

          </div>

        </div>

      </main>

    </div>

  )

}