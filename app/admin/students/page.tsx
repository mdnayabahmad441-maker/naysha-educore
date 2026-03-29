"use client"

import { useEffect, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function StudentsPage(){

  const router = useRouter()

  const [students,setStudents] = useState<any[]>([])
  const [filtered,setFiltered] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [role,setRole] = useState<string | null>(null)
  const [schoolId,setSchoolId] = useState<string | null>(null)

  useEffect(()=>{
    const loadRole = async()=>{
      const r = await getUserRole()
      setRole(r?.role || null)
    }
    loadRole()
  },[])

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  const loadStudents = async () => {

    if(!schoolId) return

    setLoading(true)

    const { data } = await supabase
      .from("students")
      .select(`*, classes(name)`)
      .eq("school_id", schoolId)

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
  },[schoolId])

  useEffect(()=>{
    const f = students.filter(s =>
      s.name?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(f)
  },[search,students])

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
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">
            {students.length} enrolled students
          </p>
        </div>

        {role === "admin" && (
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-sm font-medium">
            + Add Student
          </button>
        )}

      </div>

      {/* SEARCH */}
      <div>
        <input
          placeholder="🔍 Search by name, ID, class..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="w-full md:w-96 px-4 py-2 rounded-lg bg-[#0b1220] border border-white/10 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* FORM */}
      {role === "admin" && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <StudentForm reload={loadStudents}/>
        </div>
      )}

      {/* TABLE */}
      <div className="bg-[#0b1220] border border-white/10 rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Class</th>
              <th className="p-4 text-left">Roll</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            ) : (
              filtered.map((s)=>(
                <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">

                  <td className="p-4 text-gray-400">
                    {s.id?.slice(0,4).toUpperCase()}
                  </td>

                  <td className="p-4 font-medium">
                    {s.name}
                  </td>

                  <td className="p-4">
                    {s.classes?.name || "-"}
                  </td>

                  <td className="p-4">
                    {s.roll_number || "-"}
                  </td>

                  {/* STATUS BADGE */}
                  <td className="p-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      Active
                    </span>
                  </td>

                  <td className="p-4 text-right">
                    <button
                      onClick={()=>handleView(s.id)}
                      className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs"
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