"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TeacherStudents() {

  const [students, setStudents] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user?.email) return

      // 🔥 GET TEACHER
      const { data: teacher } = await supabase
        .from("teachers")
        .select("*")
        .eq("email", user.email)
        .maybeSingle()

      if (!teacher) return

      // 🔥 GET STUDENTS OF SCHOOL
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("school_id", teacher.school_id)

      setStudents(data || [])
    }

    load()

  }, [])

  return (
    <div className="p-6 text-white">

      <h1 className="text-2xl mb-6">Students</h1>

      <div className="bg-white/10 rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
            </tr>
          </thead>

          <tbody>

            {students.length === 0 ? (
              <tr>
                <td colSpan={2} className="p-4 text-center text-gray-400">
                  No students found
                </td>
              </tr>
            ) : (
              students.map((s) => (
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