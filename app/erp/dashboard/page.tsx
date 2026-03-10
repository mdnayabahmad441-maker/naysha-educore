"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Dashboard({children}:{children?:React.ReactNode}){

  const router = useRouter()

  const [role,setRole] = useState("")
  const [loading,setLoading] = useState(true)

  const [students,setStudents] = useState(0)
  const [teachers,setTeachers] = useState(0)
  const [fees,setFees] = useState(0)

  useEffect(()=>{
    loadUser()
  },[])

  async function loadUser(){

    const { data } = await supabase.auth.getSession()

    if(!data.session){
      router.push("/erp/login")
      return
    }

    const userId = data.session.user.id

    const { data:user } =
      await supabase
        .from("users")
        .select("role,school_id")
        .eq("id",userId)
        .single()

    if(!user){
      router.push("/erp/login")
      return
    }

    setRole(user.role)

    const schoolId = user.school_id


    // LOAD STUDENTS COUNT

    const { data:studentsData } =
      await supabase
        .from("students")
        .select("id")
        .eq("school_id",schoolId)

    setStudents(studentsData?.length || 0)


    // LOAD TEACHERS COUNT

    const { data:teachersData } =
      await supabase
        .from("teachers")
        .select("id")
        .eq("school_id",schoolId)

    setTeachers(teachersData?.length || 0)


    // LOAD TOTAL FEES

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

    setLoading(false)

  }

  if(loading){
    return(
      <div className="p-10 text-white">
        Loading dashboard...
      </div>
    )
  }

  return(

    <div className="min-h-screen flex bg-slate-950 text-white">

      {/* SIDEBAR */}

      <aside className="w-64 bg-gradient-to-b from-blue-900 via-indigo-900 to-purple-900 p-6">

        <h1 className="text-2xl font-bold mb-10 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
          NaySha EduCore
        </h1>

        <nav className="space-y-4">

          <Link href="/erp/dashboard" className="block px-4 py-2 rounded hover:bg-white/10">
            Dashboard
          </Link>

          {(role === "admin" || role === "teacher") && (
            <Link href="/erp/dashboard/students" className="block px-4 py-2 rounded hover:bg-white/10">
              Students
            </Link>
          )}

          {role === "admin" && (
            <Link href="/erp/dashboard/teachers" className="block px-4 py-2 rounded hover:bg-white/10">
              Teachers
            </Link>
          )}

          {(role === "admin" || role === "teacher") && (
            <Link href="/erp/dashboard/attendance" className="block px-4 py-2 rounded hover:bg-white/10">
              Attendance
            </Link>
          )}

          {role === "admin" && (
            <Link href="/erp/dashboard/fees" className="block px-4 py-2 rounded hover:bg-white/10">
              Fees
            </Link>
          )}

          {(role === "admin" || role === "teacher") && (
            <Link href="/erp/dashboard/exams" className="block px-4 py-2 rounded hover:bg-white/10">
              Exams
            </Link>
          )}

          {(role === "admin" || role === "teacher") && (
            <Link href="/erp/dashboard/exams/results" className="block px-4 py-2 rounded hover:bg-white/10">
              Results
            </Link>
          )}

          {(role === "admin" || role === "teacher") && (
            <Link href="/erp/dashboard/reports" className="block px-4 py-2 rounded hover:bg-white/10">
              Reports
            </Link>
          )}

          {role === "admin" && (
            <Link href="/erp/dashboard/settings" className="block px-4 py-2 rounded hover:bg-white/10">
              Settings
            </Link>
          )}

        </nav>

      </aside>


      {/* MAIN */}

      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          Dashboard Overview
        </h2>

        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Total Students</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              {students}
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Teachers</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              {teachers}
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Fees Collected</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹{fees.toLocaleString()}
            </h3>
          </div>

        </div>

      </main>

    </div>

  )

}