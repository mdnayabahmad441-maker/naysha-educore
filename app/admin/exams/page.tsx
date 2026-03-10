"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function ExamsPage(){

  const [name,setName] = useState("")
  const [className,setClassName] = useState("")
  const [exams,setExams] = useState<any[]>([])
  const [schoolId,setSchoolId] = useState<string | null>(null)

  useEffect(()=>{
    loadSchool()
  },[])



  async function loadSchool(){

    const { data } = await supabase.auth.getSession()

    const userId = data.session?.user.id

    if(!userId) return

    const { data:user } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(user){
      setSchoolId(user.school_id)
      loadExams(user.school_id)
    }

  }



  async function loadExams(id:string){

    const { data } =
      await supabase
        .from("exams")
        .select("*")
        .eq("school_id",id)
        .order("created_at",{ascending:false})

    if(data){
      setExams(data)
    }

  }



  async function createExam(){

    if(!name || !className){
      alert("Fill all fields")
      return
    }

    if(!schoolId) return

    const { error } =
      await supabase
        .from("exams")
        .insert({
          name:name,
          class:className,
          school_id:schoolId
        })

    if(error){
      alert(error.message)
      return
    }

    setName("")
    setClassName("")

    loadExams(schoolId)

  }



  return(

    <div className="p-10 text-white">

      <div className="flex items-center justify-between mb-8">

  <h1 className="text-3xl font-bold">
    Exams
  </h1>

  <Link
    href="/admin/exams/marks"
    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg"
  >
    Enter Marks
  </Link>

</div>


      {/* CREATE EXAM */}

      <div className="bg-white/10 p-6 rounded-xl w-[350px] mb-10">

        <h2 className="text-xl font-bold mb-4">
          Create Exam
        </h2>

        <input
          placeholder="Exam Name"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Class"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={className}
          onChange={(e)=>setClassName(e.target.value)}
        />

        <button
          onClick={createExam}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Create Exam
        </button>

      </div>



      {/* EXAMS LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl font-bold mb-6">
          Exams List
        </h2>

        <table className="w-full">

          <thead>

            <tr className="text-left border-b border-white/20">
              <th className="py-2">Exam</th>
              <th>Class</th>
            </tr>

          </thead>

          <tbody>

            {exams.map((e)=>(
              <tr key={e.id} className="border-b border-white/10">
                <td className="py-2">{e.name}</td>
                <td>{e.class}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}