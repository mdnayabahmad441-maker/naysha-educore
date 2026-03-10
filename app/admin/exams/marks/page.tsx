"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksEntryPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<string[]>([])
  const [className,setClassName] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [examId,setExamId] = useState("")
  const [exams,setExams] = useState<any[]>([])

  const [subject,setSubject] = useState("")

  const [marks,setMarks] = useState<any>({})


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

      loadClasses(user.school_id)
      loadExams(user.school_id)

    }

  }



  async function loadClasses(id:string){

    const { data } =
      await supabase
        .from("students")
        .select("class")
        .eq("school_id",id)

    const uniqueClasses =
      [...new Set(data?.map((s:any)=>s.class))]

    setClasses(uniqueClasses)

  }



  async function loadExams(id:string){

    const { data } =
      await supabase
        .from("exams")
        .select("*")
        .eq("school_id",id)

    if(data){
      setExams(data)
    }

  }



  async function loadStudents(){

    if(!className || !schoolId) return

    const { data } =
      await supabase
        .from("students")
        .select("*")
        .eq("school_id",schoolId)
        .eq("class",className)

    if(data){
      setStudents(data)
    }

  }



  async function saveMarks(){

    if(!examId || !subject){
      alert("Select exam and subject")
      return
    }

    for(const studentId in marks){

      await supabase
        .from("marks")
        .insert({
          student_id:studentId,
          exam_id:examId,
          subject:subject,
          marks:marks[studentId],
          school_id:schoolId
        })

    }

    alert("Marks saved successfully")

  }



  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Marks Entry
      </h1>



      {/* SELECT OPTIONS */}

      <div className="flex gap-4 mb-6">

        <select
          className="bg-slate-800 p-2 rounded"
          value={examId}
          onChange={(e)=>setExamId(e.target.value)}
        >

          <option value="">Select Exam</option>

          {exams.map((e)=>(
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}

        </select>



        <select
          className="bg-slate-800 p-2 rounded"
          value={className}
          onChange={(e)=>setClassName(e.target.value)}
        >

          <option value="">Select Class</option>

          {classes.map((c)=>(
            <option key={c}>{c}</option>
          ))}

        </select>



        <input
          placeholder="Subject"
          className="bg-slate-800 p-2 rounded"
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        />


        <button
          onClick={loadStudents}
          className="bg-cyan-600 px-4 rounded"
        >
          Load Students
        </button>

      </div>



      {/* STUDENT MARKS TABLE */}

      <table className="w-full bg-white/10 rounded-xl">

        <thead>

          <tr className="border-b border-white/20">

            <th className="text-left p-3">
              Student
            </th>

            <th>
              Marks
            </th>

          </tr>

        </thead>

        <tbody>

          {students.map((s)=>(
            <tr key={s.id} className="border-b border-white/10">

              <td className="p-3">
                {s.name}
              </td>

              <td>

                <input
                  type="number"
                  className="bg-slate-800 p-2 rounded w-24"
                  onChange={(e)=>{

                    setMarks({
                      ...marks,
                      [s.id]:e.target.value
                    })

                  }}
                />

              </td>

            </tr>
          ))}

        </tbody>

      </table>



      <button
        onClick={saveMarks}
        className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
      >
        Save Marks
      </button>


    </div>

  )

}