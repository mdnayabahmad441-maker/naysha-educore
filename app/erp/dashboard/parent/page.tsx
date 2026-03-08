"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentPortal(){

  const [students,setStudents] = useState<any[]>([])
  const [attendance,setAttendance] = useState<any[]>([])
  const [results,setResults] = useState<any[]>([])

  const [studentId,setStudentId] = useState("")

  async function fetchStudents(){

    const {data} =
      await supabase.from("students").select("*")

    if(data) setStudents(data)

  }

  async function loadStudentData(){

    const {data:attendanceData} =
      await supabase
      .from("attendance")
      .select("*")
      .eq("student_id",studentId)

    const {data:resultsData} =
      await supabase
      .from("results")
      .select("*")
      .eq("student_id",studentId)

    if(attendanceData) setAttendance(attendanceData)
    if(resultsData) setResults(resultsData)

  }

  useEffect(()=>{
    fetchStudents()
  },[])

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Parent Portal
      </h1>

      <div className="bg-white/10 p-6 rounded-xl mb-8 w-[400px]">

        <select
        className="w-full p-2 mb-4 rounded bg-slate-800"
        onChange={(e)=>setStudentId(e.target.value)}
        >

          <option>Select Student</option>

          {students.map((s)=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}

        </select>

        <button
        onClick={loadStudentData}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Load Student Data
        </button>

      </div>

      {/* ATTENDANCE */}

      {attendance.length>0 && (

      <div className="bg-white/10 p-6 rounded-xl mb-8">

        <h2 className="text-xl font-bold mb-4">
          Attendance
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-400">
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {attendance.map((a)=>(
              <tr key={a.id} className="border-t border-gray-700">

                <td className="py-2">{a.date}</td>
                <td>{a.status}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      )}

      {/* RESULTS */}

      {results.length>0 && (

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-4">
          Exam Results
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-400">
              <th>Subject</th>
              <th>Marks</th>
            </tr>
          </thead>

          <tbody>

            {results.map((r)=>(
              <tr key={r.id} className="border-t border-gray-700">

                <td className="py-2">{r.subject}</td>
                <td>{r.marks}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      )}

    </div>

  )

}