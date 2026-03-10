"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function StudentsPage(){

  const [name,setName] = useState("")
  const [className,setClassName] = useState("")
  const [roll,setRoll] = useState("")
  const [phone,setPhone] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)


  useEffect(()=>{
    getSchool()
  },[])



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

      fetchStudents(data.school_id)

    }

  }



  async function fetchStudents(id:string){

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

    if(!name || !className || !roll){
      alert("Fill required fields")
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
          class:className,
          roll_number:roll,
          parent_phone:phone,
          school_id:schoolId
        })

    if(error){
      alert(error.message)
      return
    }

    setName("")
    setClassName("")
    setRoll("")
    setPhone("")

    fetchStudents(schoolId)

  }



  return(

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Students
      </h1>



      {/* ADD STUDENT */}

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
          placeholder="Class"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={className}
          onChange={(e)=>setClassName(e.target.value)}
        />

        <input
          placeholder="Roll Number"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={roll}
          onChange={(e)=>setRoll(e.target.value)}
        />

        <input
          placeholder="Parent Phone"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <button
          onClick={addStudent}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Add Student
        </button>

      </div>



      {/* STUDENTS TABLE */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Student List
        </h2>

        <table className="w-full">

          <thead>

            <tr className="border-b border-white/20">

              <th className="text-left py-2">Name</th>
              <th className="text-left">Class</th>
              <th className="text-left">Roll</th>
              <th className="text-left">Parent Phone</th>

            </tr>

          </thead>

          <tbody>

            {students.map((s)=>(

              <tr key={s.id} className="border-b border-white/10">

                <td className="py-2">{s.name}</td>
                <td>{s.class}</td>
                <td>{s.roll_number}</td>
                <td>{s.parent_phone}</td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}