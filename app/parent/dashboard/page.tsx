"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentDashboard(){

  const [student,setStudent] = useState<any>(null)
  const [attendance,setAttendance] = useState<any[]>([])

  useEffect(()=>{
    loadData()
  },[])


  async function loadData(){

    const { data:userData } =
      await supabase.auth.getUser()

    const email = userData.user?.email

    if(!email) return


    // GET STUDENT

    const { data:studentData } =
      await supabase
        .from("students")
        .select("*")
        .eq("parent_email",email)
        .single()

    if(!studentData) return

    setStudent(studentData)


    // GET ATTENDANCE

    const { data:attendanceData } =
      await supabase
        .from("attendance")
        .select("*")
        .eq("student_id",studentData.id)
        .order("date",{ascending:false})

    if(attendanceData){
      setAttendance(attendanceData)
    }

  }


  if(!student){

    return(
      <div className="p-10 text-white">
        Loading student...
      </div>
    )

  }


  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Parent Dashboard
      </h1>


      {/* STUDENT PROFILE */}

      <div className="bg-white/10 p-6 rounded-xl mb-8">

        <h2 className="text-xl font-bold mb-4">
          Student Profile
        </h2>

        <p>Name: {student.name}</p>
        <p>Class: {student.class}</p>
        <p>Roll: {student.roll_number}</p>

      </div>



      {/* ATTENDANCE */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Attendance
        </h2>

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/20">

              <th className="text-left py-2">Date</th>
              <th>Status</th>

            </tr>

          </thead>

          <tbody>

            {attendance.map((a)=>(

              <tr key={a.id} className="border-b border-white/10">

                <td className="py-2">{a.date}</td>
                <td>{a.status}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}