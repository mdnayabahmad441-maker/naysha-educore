"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function AttendancePage(){

  const [students,setStudents] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [date,setDate] = useState("")

  useEffect(()=>{
    loadData()
  },[])


  async function loadData(){

    const { data:userData } =
      await supabase.auth.getUser()

    const userId = userData.user?.id

    if(!userId) return


    const { data:user } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(!user) return

    setSchoolId(user.school_id)


    const { data:studentsData } =
      await supabase
        .from("students")
        .select("*")
        .eq("school_id",user.school_id)

    if(studentsData){
      setStudents(studentsData)
    }

  }



  async function markAttendance(studentId:string,status:string){

    if(!date){
      alert("Select date")
      return
    }

    const { error } =
      await supabase
        .from("attendance")
        .insert({
          student_id:studentId,
          date:date,
          status:status,
          school_id:schoolId
        })

    if(error){
      alert(error.message)
    }

  }



  return(

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Attendance
      </h1>


      <div className="mb-6">

        <input
          type="date"
          className="p-2 rounded bg-slate-800"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
        />

      </div>


      <div className="bg-white/10 p-6 rounded-xl">

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/20">

              <th className="text-left py-2">Name</th>
              <th className="text-left">Class</th>
              <th className="text-left">Present</th>
              <th className="text-left">Absent</th>

            </tr>

          </thead>

          <tbody>

            {students.map((s)=>(

              <tr key={s.id} className="border-b border-white/10">

                <td className="py-2">{s.name}</td>
                <td>{s.class}</td>

                <td>

                  <button
                    onClick={()=>markAttendance(s.id,"present")}
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    Present
                  </button>

                </td>

                <td>

                  <button
                    onClick={()=>markAttendance(s.id,"absent")}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    Absent
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