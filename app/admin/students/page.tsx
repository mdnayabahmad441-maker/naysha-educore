"use client"

import { useEffect, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

export default function StudentsPage(){

  const router = useRouter()

  const [students,setStudents] = useState<any[]>([])
  const [filtered,setFiltered] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [search,setSearch] = useState("")
  const [role,setRole] = useState<string | null>(null)
  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [showForm,setShowForm] = useState(false)

  useEffect(()=>{
    getUserRole().then(r=>setRole(r?.role || null))
  },[])

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  const loadStudents = async () => {

    if(!schoolId) return

    setLoading(true)

    const year = await getActiveAcademicYear()

    const { data, error } = await supabase
      .from("student_enrollments")
      .select(`
        id,
        roll_number,
        students(id,name),
        classes(name)
      `)
      .eq("school_id", schoolId)
      .eq("academic_year_id", year?.id)

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    const formatted = (data || []).map((e:any)=>({
      id: e.students?.id,
      name: e.students?.name,
      roll_number: e.roll_number,
      class_name: e.classes?.name
    }))

    const sorted = formatted.sort((a:any,b:any)=>{
      if(a.class_name === b.class_name){
        return Number(a.roll_number || 0) - Number(b.roll_number || 0)
      }
      return (a.class_name || "").localeCompare(b.class_name || "")
    })

    setStudents(sorted)
    setFiltered(sorted)
    setLoading(false)
  }

  useEffect(()=>{
    loadStudents()
  },[schoolId])

  useEffect(()=>{
    const term = search.toLowerCase()

    const f = students.filter(s =>
      (s.name || "").toLowerCase().includes(term) ||
      (s.id || "").toLowerCase().includes(term) ||
      (s.class_name || "").toLowerCase().includes(term)
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

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Students</h1>
          <p className="text-sm text-gray-400">
            {students.length} enrolled students
          </p>
        </div>

        {role === "admin" && (
          <button
            onClick={()=>setShowForm(prev=>!prev)}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-sm"
          >
            {showForm ? "Close" : "+ Add Student"}
          </button>
        )}
      </div>

      <input
        placeholder="Search..."
        value={search}
        onChange={(e)=>setSearch(e.target.value)}
        className="w-full md:w-96 px-4 py-2 rounded-lg bg-[#0b1220] border border-white/10 text-sm"
      />

      {role === "admin" && showForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <StudentForm reload={()=>{
            loadStudents()
            setShowForm(false)
          }}/>
        </div>
      )}

      <div className="bg-[#0b1220] border border-white/10 rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="text-gray-400 border-b border-white/10">
            <tr>
              <th className="p-4 text-left">ID</th>
              <th className="p-4 text-left">Name</th>
              <th className="p-4 text-left">Class</th>
              <th className="p-4 text-left">Roll</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : filtered.map((s)=>(
              <tr key={s.id} className="border-t border-white/5 hover:bg-white/5">

                <td className="p-4 text-gray-400">
                  {s.id?.slice(0,4)}
                </td>

                <td className="p-4 font-medium">{s.name}</td>

                <td className="p-4">{s.class_name || "-"}</td>

                <td className="p-4">{s.roll_number || "-"}</td>

                <td className="p-4 text-right">
                  <button
                    onClick={()=>handleView(s.id)}
                    className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs"
                  >
                    View
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  )
}