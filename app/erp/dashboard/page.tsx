"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Dashboard({children}:{children?:React.ReactNode}){

  const router = useRouter()

  const [role,setRole] = useState("")
  const [loading,setLoading] = useState(true)

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
        .select("role")
        .eq("id",userId)
        .single()

    if(user){
      setRole(user.role)
    }

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


          {/* ADMIN + TEACHER */}

          {(role === "admin" || role === "teacher") && (

            <Link href="/erp/dashboard/students" className="block px-4 py-2 rounded hover:bg-white/10">
              Students
            </Link>

          )}


          {/* ADMIN ONLY */}

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


          {/* FEES → ADMIN ONLY */}

          {role === "admin" && (

            <Link href="/erp/dashboard/fees" className="block px-4 py-2 rounded hover:bg-white/10">
              Fees
            </Link>

          )}


          {/* EXAMS */}

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


          {/* REPORTS */}

          {(role === "admin" || role === "teacher") && (

            <Link href="/erp/dashboard/reports" className="block px-4 py-2 rounded hover:bg-white/10">
              Reports
            </Link>

          )}


          {/* SETTINGS ADMIN ONLY */}

          {role === "admin" && (

            <Link href="/erp/dashboard/settings" className="block px-4 py-2 rounded hover:bg-white/10">
              Settings
            </Link>

          )}

        </nav>

      </aside>



      {/* MAIN CONTENT */}

      <main className="flex-1 p-10">

        <h2 className="text-3xl font-bold mb-8">
          Dashboard Overview
        </h2>

        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Total Students</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              1248
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Teachers</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              86
            </h3>
          </div>

          <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">
            <p className="text-gray-400">Fees Collected</p>
            <h3 className="text-3xl font-bold text-cyan-400 mt-2">
              ₹8.2L
            </h3>
          </div>

        </div>

      </main>

    </div>

  )

}