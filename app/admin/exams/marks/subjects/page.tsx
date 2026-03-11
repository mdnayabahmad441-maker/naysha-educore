"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SubjectsPage(){

  const [schoolId,setSchoolId] = useState("")
  const [subjects,setSubjects] = useState<any[]>([])

  const [className,setClassName] = useState("")
  const [subjectName,setSubjectName] = useState("")
  const [maxMarks,setMaxMarks] = useState("")
  const [passMarks,setPassMarks] = useState("")

  useEffect(()=>{
    loadSchool()
  },[])


  async function loadSchool(){

    const { data } = await supabase.auth.getSession()

    const userId = data.session?.user.id

    const { data:user } = await supabase
      .from("users")
      .select("school_id")
      .eq("id",userId)
      .single()

    if(user){

      setSchoolId(user.school_id)
      loadSubjects(user.school_id)

    }

  }


  async function loadSubjects(school:string){

    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id",school)
      .order("class")

    setSubjects(data || [])

  }



  async function addSubject(){

    if(!className || !subjectName){
      alert("Fill all fields")
      return
    }

    await supabase
      .from("subjects")
      .insert({
        school_id:schoolId,
        class:className,
        name:subjectName,
        max_marks:maxMarks,
        pass_marks:passMarks
      })

    setSubjectName("")
    setMaxMarks("")
    setPassMarks("")

    loadSubjects(schoolId)

  }


  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Subjects Management
      </h1>


      {/* ADD SUBJECT */}

      <div className="bg-white/10 p-6 rounded mb-10">

        <h2 className="text-xl mb-4">
          Add Subject
        </h2>

        <div className="grid grid-cols-4 gap-4">

          <input
            placeholder="Class"
            className="p-2 rounded bg-slate-800"
            value={className}
            onChange={(e)=>setClassName(e.target.value)}
          />

          <input
            placeholder="Subject Name"
            className="p-2 rounded bg-slate-800"
            value={subjectName}
            onChange={(e)=>setSubjectName(e.target.value)}
          />

          <input
            placeholder="Max Marks"
            className="p-2 rounded bg-slate-800"
            value={maxMarks}
            onChange={(e)=>setMaxMarks(e.target.value)}
          />

          <input
            placeholder="Pass Marks"
            className="p-2 rounded bg-slate-800"
            value={passMarks}
            onChange={(e)=>setPassMarks(e.target.value)}
          />

        </div>

        <button
          onClick={addSubject}
          className="mt-4 bg-green-600 px-6 py-2 rounded"
        >
          Add Subject
        </button>

      </div>



      {/* SUBJECT LIST */}

      <table className="w-full border border-white/20">

        <thead>

          <tr className="bg-white/10">

            <th className="p-2">Class</th>
            <th className="p-2">Subject</th>
            <th className="p-2">Max Marks</th>
            <th className="p-2">Pass Marks</th>

          </tr>

        </thead>

        <tbody>

          {subjects.map((s)=>(
            <tr key={s.id}>

              <td className="p-2">{s.class}</td>
              <td className="p-2">{s.name}</td>
              <td className="p-2">{s.max_marks}</td>
              <td className="p-2">{s.pass_marks}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  )

}