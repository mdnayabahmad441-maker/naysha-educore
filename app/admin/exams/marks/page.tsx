"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function EnterMarks() {

  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [marks, setMarks] = useState<{[key:string]:number}>({})
  const [schoolId, setSchoolId] = useState<string | null>(null)

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

      loadExams(user.school_id)

    }

  }

  async function loadExams(school:string){

    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id",school)

    setExams(data || [])

  }


  async function loadStudents(){

    if(!selectedExam){
      alert("Select exam first")
      return
    }

    const exam = exams.find(e=>e.id === selectedExam)

    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("class",exam.class)

    setStudents(data || [])

  }

  function updateMarks(studentId:string,value:number){

    setMarks({
      ...marks,
      [studentId]:value
    })

  }

  async function saveMarks(){

    if(!selectedExam){
      alert("Select exam")
      return
    }

    for(const studentId in marks){

      await supabase
        .from("marks")
        .insert({
          student_id:studentId,
          exam_id:selectedExam,
          marks:marks[studentId]
        })

    }

    alert("Marks saved")

  }

  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Marks Entry
      </h1>

      {/* EXAM SELECT */}

      <select
        className="bg-slate-800 p-2 rounded mb-4"
        value={selectedExam}
        onChange={(e)=>setSelectedExam(e.target.value)}
      >

        <option value="">
          Select Exam
        </option>

        {exams.map(exam=>(
          <option key={exam.id} value={exam.id}>
            {exam.name} - Class {exam.class} - {exam.subject}
          </option>
        ))}

      </select>

      <br/>

      <button
        onClick={loadStudents}
        className="bg-cyan-600 px-4 py-2 rounded mb-6"
      >
        Load Students
      </button>


      {/* MARKS TABLE */}

      {students.length > 0 && (

        <table className="w-full border border-white/20">

          <thead>

            <tr className="bg-white/10">

              <th className="p-2 text-left">
                Student
              </th>

              <th className="p-2">
                Marks
              </th>

            </tr>

          </thead>

          <tbody>

            {students.map(student=>(
              <tr key={student.id}>

                <td className="p-2">
                  {student.name}
                </td>

                <td className="p-2">

                  <input
                    type="number"
                    className="bg-slate-800 p-1 rounded w-24"
                    onChange={(e)=>
                      updateMarks(student.id,Number(e.target.value))
                    }
                  />

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      )}

      {students.length > 0 && (

        <button
          onClick={saveMarks}
          className="mt-6 bg-green-600 px-6 py-2 rounded"
        >
          Save Marks
        </button>

      )}

    </div>

  )

}