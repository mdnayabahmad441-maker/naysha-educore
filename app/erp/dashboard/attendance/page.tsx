"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function AttendancePage() {

  const [students, setStudents] = useState<any[]>([])
  const [date, setDate] = useState("")

  async function fetchStudents() {
    const { data } = await supabase
      .from("students")
      .select("*")

    if (data) {
      setStudents(data)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [])

  async function markAttendance(studentId: string, status: string) {

    await supabase.from("attendance").insert([
      {
        student_id: studentId,
        date: date,
        status: status
      }
    ])

    alert("Attendance Saved")
  }

  return (
    <div>

      <h1 className="text-3xl font-bold mb-6">
        Attendance
      </h1>

      <input
        type="date"
        className="p-2 mb-6 rounded bg-slate-800"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
      />

      <table className="w-full">

        <thead>
          <tr className="text-left text-gray-400">
            <th>Name</th>
            <th>Roll</th>
            <th>Present</th>
            <th>Absent</th>
          </tr>
        </thead>

        <tbody>

          {students.map((student)=>(
            <tr key={student.id} className="border-t border-gray-700">

              <td className="py-3">{student.name}</td>
              <td>{student.roll_number}</td>

              <td>
                <button
                  className="px-3 py-1 bg-green-600 rounded"
                  onClick={()=>markAttendance(student.id,"Present")}
                >
                  Present
                </button>
              </td>

              <td>
                <button
                  className="px-3 py-1 bg-red-600 rounded"
                  onClick={()=>markAttendance(student.id,"Absent")}
                >
                  Absent
                </button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}