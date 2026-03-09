"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function StudentsPage(){

  const router = useRouter()

  const [name,setName] = useState("")
  const [roll,setRoll] = useState("")
  const [studentClass,setStudentClass] = useState("")
  const [students,setStudents] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)


  async function getSchool(){

    const { data:userData } =
      await supabase.auth.getUser()

    const userId = userData.user?.id

    if(!userId) return

    const { data } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(data){
      setSchoolId(data.school_id)
      loadStudents(data.school_id)
    }

  }


  async function loadStudents(id:string){

    const { data } =
      await supabase
        .from("students")
        .select("*")
        .eq("school_id",id)
        .order("created_at",{ascending:false})

    if(data){
      setStudents(data)
    }

  }


  async function addStudent(){

    if(!name || !roll || !studentClass){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not found")
      return
    }

    const { error } =
      await supabase
        .from("students")
        .insert({
          name:name,
          roll_number:roll,
          class:studentClass,
          school_id:schoolId
        })

    if(error){
      alert(error.message)
      return
    }

    setName("")
    setRoll("")
    setStudentClass("")

    loadStudents(schoolId)

  }


  useEffect(()=>{
    getSchool()
  },[])



  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Student Management
      </h1>


      {/* ADD STUDENT FORM */}

      <div className="bg-white/10 p-6 rounded-xl w-[350px] mb-10">

        <h2 className="text-xl font-bold mb-4">
          Add Student
        </h2>

        <input
          placeholder="Student Name"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Roll Number"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={roll}
          onChange={(e)=>setRoll(e.target.value)}
        />

        <input
          placeholder="Class"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={studentClass}
          onChange={(e)=>setStudentClass(e.target.value)}
        />

        <button
          onClick={addStudent}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Add Student
        </button>

      </div>


      {/* STUDENTS LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Students List
        </h2>

        <table className="w-full">

          <thead>

            <tr className="text-left border-b border-white/20">

              <th className="py-2">Name</th>
              <th>Roll</th>
              <th>Class</th>

            </tr>

          </thead>

          <tbody>

            {students.map((s)=>(

              <tr
                key={s.id}
                className="border-b border-white/10 cursor-pointer hover:bg-white/5"
                onClick={()=>router.push(`/erp/dashboard/students/${s.id}`)}
              >

                <td className="py-2">{s.name}</td>
                <td>{s.roll_number}</td>
                <td>{s.class}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}