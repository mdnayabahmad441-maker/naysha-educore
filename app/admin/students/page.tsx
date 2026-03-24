"use client"

import { useEffect, useState } from "react"
import StudentForm from "@/components/students/StudentForm"
import { dbGet } from "@/lib/db"

export default function StudentsPage(){

  const [students,setStudents] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  // LOAD STUDENTS (MULTI-TENANT SAFE)
  const loadStudents = async () => {

    setLoading(true)

    const data = await dbGet("students")
    setStudents(data || [])

    setLoading(false)
  }

  useEffect(()=>{
    loadStudents()
  },[])

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6 font-semibold">
        Students
      </h1>

      {/* FORM */}
      <div className="bg-white/10 backdrop-blur-lg border border-white/10 p-6 rounded-xl">
        <StudentForm reload={loadStudents}/>
      </div>

      {/* TABLE */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((s)=>(
                <tr key={s.id} className="border-t border-white/10">
                  <td className="p-3">{s.name}</td>
                  <td className="p-3">{s.email}</td>
                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>

    </div>
  )
}