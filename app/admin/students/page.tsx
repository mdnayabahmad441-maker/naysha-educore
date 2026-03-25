"use client"

import { useEffect, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { supabase } from "@/lib/supabase" // 🔥 IMPORTANT CHANGE

export default function StudentsPage(){

  const router = useRouter()

  const [students,setStudents] = useState<any[]>([])
  const [filtered,setFiltered] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [role,setRole] = useState<string | null>(null)

  // =========================
  // LOAD ROLE
  // =========================
  useEffect(()=>{
    const loadRole = async()=>{
      const r = await getUserRole()
      setRole(r?.role || null)
    }
    loadRole()
  },[])

  // =========================
  // LOAD STUDENTS (JOIN + SORT)
  // =========================
  const loadStudents = async () => {

    setLoading(true)

    const { data } = await supabase
      .from("students")
      .select(`
        *,
        classes(name)
      `)

    // 🔥 SORT BY CLASS + ROLL
    const sorted = (data || []).sort((a:any,b:any)=>{
      if(a.class_id === b.class_id){
        return (a.roll_number || 0) - (b.roll_number || 0)
      }
      return (a.classes?.name || "").localeCompare(b.classes?.name || "")
    })

    setStudents(sorted)
    setFiltered(sorted)

    setLoading(false)
  }

  useEffect(()=>{
    loadStudents()
  },[])

  // =========================
  // SEARCH
  // =========================
  useEffect(()=>{
    const f = students.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(f)
  },[search,students])

  // =========================
  // VIEW
  // =========================
  const handleView = (id:string)=>{
    if(role === "teacher"){
      alert("Not allowed")
      return
    }
    router.push(`/admin/students/${id}`)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">

        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-gray-400 text-sm">
            Class-wise student list
          </p>
        </div>

        <input
          placeholder="Search student..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="px-4 py-2 rounded-lg bg-[#0b1220] border border-white/10 text-sm w-full md:w-64"
        />

      </div>

      {/* FORM */}
      {role === "admin" && (
        <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
          <StudentForm reload={loadStudents}/>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-white/10 text-gray-300">
            <tr>
              <th className="p-4 text-left">Student</th>
              <th className="p-4 text-left">Class</th>
              <th className="p-4 text-left">Roll</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  Loading students...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            ) : (
              filtered.map((s)=>(
                <tr key={s.id} className="border-t border-white/10">

                  {/* NAME */}
                  <td className="p-4 flex items-center gap-3">

                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold">
                      {s.name?.charAt(0)?.toUpperCase()}
                    </div>

                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-xs text-gray-400">
                        ID: {s.id?.slice(0,6)}
                      </p>
                    </div>

                  </td>

                  {/* CLASS */}
                  <td className="p-4 text-gray-300">
                    {s.classes?.name || "-"}
                  </td>

                  {/* ROLL */}
                  <td className="p-4 text-gray-300">
                    {s.roll_number || "-"}
                  </td>

                  {/* ACTION */}
                  <td className="p-4 text-right">

                    <button
                      onClick={()=>handleView(s.id)}
                      disabled={role === "teacher"}
                      className={`px-4 py-2 text-xs rounded-lg ${
                        role === "teacher"
                          ? "bg-gray-700 text-gray-400"
                          : "bg-white/10 hover:bg-white/20"
                      }`}
                    >
                      View
                    </button>

                  </td>

                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}