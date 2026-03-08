"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

  const [students,setStudents] = useState<any[]>([])
  const [exams,setExams] = useState<any[]>([])
  const [studentId,setStudentId] = useState("")
  const [examId,setExamId] = useState("")
  const [subject,setSubject] = useState("")
  const [marks,setMarks] = useState("")

  async function fetchData(){

    const {data:studentsData} =
      await supabase.from("students").select("*")

    const {data:examsData} =
      await supabase.from("exams").select("*")

    if(studentsData) setStudents(studentsData)
    if(examsData) setExams(examsData)

  }

  useEffect(()=>{
    fetchData()
  },[])

  async function saveMarks(){

    await supabase.from("results").insert([
      {
        student_id:studentId,
        exam_id:examId,
        subject:subject,
        marks:marks
      }
    ])

    alert("Marks Saved")

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Enter Marks
      </h1>

      <div className="bg-white/10 p-6 rounded-xl w-[400px]">

        <select
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setStudentId(e.target.value)}
        >

          <option>Select Student</option>

          {students.map((s)=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}

        </select>

        <select
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setExamId(e.target.value)}
        >

          <option>Select Exam</option>

          {exams.map((e)=>(
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}

        </select>

        <input
        placeholder="Subject"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setSubject(e.target.value)}
        />

        <input
        placeholder="Marks"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setMarks(e.target.value)}
        />

        <button
        onClick={saveMarks}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Save Marks
        </button>

      </div>

    </div>
  )
}