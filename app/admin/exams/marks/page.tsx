"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function MarksPage() {

  const [schoolId, setSchoolId] = useState("")
  const [exams, setExams] = useState<any[]>([])
  const [classes, setClasses] = useState<string[]>([])
  const [students, setStudents] = useState<any[]>([])

  const [selectedExam, setSelectedExam] = useState("")
  const [selectedClass, setSelectedClass] = useState("")

  const [marks, setMarks] = useState<{ [key: string]: number }>({})


  useEffect(() => {
    loadSchool()
  }, [])


  async function loadSchool() {

    const { data } = await supabase.auth.getSession()

    const userId = data.session?.user.id

    const { data: user } = await supabase
      .from("users")
      .select("school_id")
      .eq("id", userId)
      .single()

    if (user) {

      setSchoolId(user.school_id)

      loadExams(user.school_id)
      loadClasses(user.school_id)

    }

  }



  async function loadExams(school: string) {

    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id", school)
      .order("created_at", { ascending: false })

    if (error) {
      console.log("Exam load error:", error)
    }

    setExams(data || [])

  }



  async function loadClasses(school: string) {

    const { data } = await supabase
      .from("students")
      .select("class")
      .eq("school_id", school)

    const uniqueClasses = [...new Set(data?.map((s: any) => s.class))]

    setClasses(uniqueClasses as string[])

  }



  async function loadStudents() {

    if (!selectedClass) {
      alert("Select class first")
      return
    }

    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("class", selectedClass)

    setStudents(data || [])

  }



  function updateMarks(studentId: string, value: number) {

    setMarks({
      ...marks,
      [studentId]: value
    })

  }



  async function saveMarks() {

    if (!selectedExam) {
      alert("Select exam first")
      return
    }

    for (const studentId in marks) {

      await supabase
        .from("marks")
        .upsert({
          student_id: studentId,
          exam_id: selectedExam,
          marks: marks[studentId]
        })

    }

    alert("Marks saved successfully")

  }



  return (

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Marks Entry
      </h1>



      {/* SELECT EXAM */}

      <select
        value={selectedExam}
        onChange={(e) => setSelectedExam(e.target.value)}
        className="bg-slate-800 p-2 rounded mr-4"
      >

        <option value="">
          Select Exam
        </option>

        {exams.map((exam) => (

          <option key={exam.id} value={exam.id}>
            {exam.name} - Class {exam.class}
          </option>

        ))}

      </select>



      {/* SELECT CLASS */}

      <select
        value={selectedClass}
        onChange={(e) => setSelectedClass(e.target.value)}
        className="bg-slate-800 p-2 rounded mr-4"
      >

        <option value="">
          Select Class
        </option>

        {classes.map((c) => (
          <option key={c}>
            {c}
          </option>
        ))}

      </select>



      <button
        onClick={loadStudents}
        className="bg-cyan-600 px-4 py-2 rounded"
      >
        Load Students
      </button>



      {/* STUDENT TABLE */}

      {students.length > 0 && (

        <table className="w-full mt-10 border border-white/20">

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

            {students.map((student) => (

              <tr key={student.id}>

                <td className="p-2">
                  {student.name}
                </td>

                <td className="p-2">

                  <input
                    type="number"
                    className="bg-slate-800 p-1 rounded w-24"
                    onChange={(e) =>
                      updateMarks(
                        student.id,
                        Number(e.target.value)
                      )
                    }
                  />

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      )}



      {/* SAVE BUTTON */}

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