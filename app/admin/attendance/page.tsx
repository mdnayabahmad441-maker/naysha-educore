"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"
import { saveAttendance } from "@/services/attendance.service"

export default function AttendancePage(){

  const [students,setStudents] = useState<any[]>([])
  const [status,setStatus] = useState<any>({})

  const today = new Date().toISOString().slice(0,10)

  useEffect(()=>{

    const load = async()=>{

      const {data}=await supabase
        .from("students")
        .select("*")

      setStudents(data || [])

    }

    load()

  },[])

  const changeStatus = (studentId:string,value:string)=>{

    setStatus({
      ...status,
      [studentId]:value
    })

  }

  const save = async()=>{

    const rows = students.map(s=>({

      id:crypto.randomUUID(),
      student_id:s.id,
      date:today,
      status:status[s.id] || "P"

    }))

    await saveAttendance(rows)

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Attendance</h1>

      <div className="overflow-x-auto">

        <table className="w-full text-sm border border-white/20">

          <thead>

            <tr>
              <th className="border p-2">Student</th>
              <th className="border p-2">Status</th>
            </tr>

          </thead>

          <tbody>

            {students.map(student=>(

              <tr key={student.id}>

                <td className="border p-2">
                  {student.name}
                </td>

                <td className="border p-2">

                  <select
                    className="bg-slate-800 border border-white/20 p-1"
                    onChange={(e)=>changeStatus(student.id,e.target.value)}
                  >

                    <option value="P">Present</option>
                    <option value="A">Absent</option>
                    <option value="L">Leave</option>

                  </select>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

      <div className="mt-4">

        <Button color="green" onClick={save}>
          Save Attendance
        </Button>

      </div>

    </div>

  )

}