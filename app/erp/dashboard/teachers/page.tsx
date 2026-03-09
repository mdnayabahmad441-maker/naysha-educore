"use client"

import { useState,useEffect } from "react"
import { supabase } from "@/lib/supabase"

export default function TeachersPage(){

  const [name,setName] = useState("")
  const [subject,setSubject] = useState("")
  const [phone,setPhone] = useState("")
  const [teachers,setTeachers] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)

  // get logged user school
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
      fetchTeachers(data.school_id)
    }

  }

  // load teachers
  async function fetchTeachers(id:string){

    const { data } =
      await supabase
        .from("teachers")
        .select("*")
        .eq("school_id",id)
        .order("created_at",{ascending:false})

    if(data){
      setTeachers(data)
    }

  }

  // add teacher
  async function addTeacher(){

    if(!name || !subject || !phone){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not found")
      return
    }

    const { error } =
      await supabase
        .from("teachers")
        .insert({
          name:name,
          subject:subject,
          phone:phone,
          school_id:schoolId
        })

    if(error){
      alert(error.message)
      return
    }

    setName("")
    setSubject("")
    setPhone("")

    fetchTeachers(schoolId)

  }

  useEffect(()=>{
    getSchool()
  },[])

  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Teacher Management
      </h1>

      {/* ADD TEACHER */}

      <div className="bg-white/10 p-6 rounded-xl w-[350px] mb-10">

        <h2 className="text-xl font-bold mb-4">
          Add Teacher
        </h2>

        <input
          placeholder="Teacher Name"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Subject"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <button
          onClick={addTeacher}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Add Teacher
        </button>

      </div>

      {/* TEACHERS LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Teachers List
        </h2>

        <table className="w-full">

          <thead>

            <tr className="text-left border-b border-white/20">

              <th className="py-2">Name</th>
              <th>Subject</th>
              <th>Phone</th>

            </tr>

          </thead>

          <tbody>

            {teachers.map((t)=>(
              <tr key={t.id} className="border-b border-white/10">

                <td className="py-2">{t.name}</td>
                <td>{t.subject}</td>
                <td>{t.phone}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}