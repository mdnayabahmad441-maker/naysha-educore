"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentAttendance() {

  const [attendance, setAttendance] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user?.email) return

      const { data: parent } = await supabase
        .from("parents")
        .select("*")
        .eq("email", user.email)
        .maybeSingle()

      if (!parent) return

      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", parent.student_id)
        .order("date", { ascending: false })

      setAttendance(data || [])
    }

    load()

  }, [])

  return (
    <div className="bg-white/10 p-6 rounded-xl">

      <h1 className="text-xl mb-4">Attendance</h1>

      <table className="w-full border border-white/10">

        <thead>
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>

        <tbody>
          {attendance.map((a) => (
            <tr key={a.id}>
              <td className="p-2 border">{a.date}</td>
              <td className="p-2 border">
                {a.status === "present" ? "✅ Present" : "❌ Absent"}
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}