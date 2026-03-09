"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TeacherDashboard(){

  const [teacher,setTeacher] = useState<any>(null)
  const [school,setSchool] = useState<any>(null)
  const [studentCount,setStudentCount] = useState(0)
  const [classesToday,setClassesToday] = useState(0)

  async function loadDashboard(){

    const { data:userData } = await supabase.auth.getUser()
    const userId = userData.user?.id

    if(!userId) return

    // get teacher
    const { data:teacherData } =
      await supabase
      .from("teachers")
      .select("*")
      .eq("user_id",userId)
      .single()

    if(!teacherData) return

    setTeacher(teacherData)

    // get school
    const { data:schoolData } =
      await supabase
      .from("schools")
      .select("name")
      .eq("id",teacherData.school_id)
      .single()

    setSchool(schoolData)

    // count students in teacher class
    const { data:students } =
      await supabase
      .from("students")
      .select("*")
      .eq("school_id",teacherData.school_id)

    if(students){
      setStudentCount(students.length)
    }

    // classes today (temporary logic)
    setClassesToday(4)

  }

  useEffect(()=>{
    loadDashboard()
  },[])

  return(

    <div className="p-6 md:p-10 text-white">

      {/* HEADER */}

      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Welcome
      </h1>

      <p className="text-gray-400 mb-8">
        {school?.name} • Teacher Dashboard
      </p>


      {/* STATS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* SUBJECT */}

        <div className="bg-white/10 p-6 rounded-xl backdrop-blur">

          <p className="text-gray-400">
            My Subject
          </p>

          <h2 className="text-2xl font-bold text-cyan-400 mt-2">
            {teacher?.subject || "Not Assigned"}
          </h2>

        </div>


        {/* CLASSES */}

        <div className="bg-white/10 p-6 rounded-xl backdrop-blur">

          <p className="text-gray-400">
            Classes Today
          </p>

          <h2 className="text-2xl font-bold text-cyan-400 mt-2">
            {classesToday}
          </h2>

        </div>


        {/* STUDENTS */}

        <div className="bg-white/10 p-6 rounded-xl backdrop-blur">

          <p className="text-gray-400">
            Students Assigned
          </p>

          <h2 className="text-2xl font-bold text-cyan-400 mt-2">
            {studentCount}
          </h2>

        </div>

      </div>

    </div>

  )

}