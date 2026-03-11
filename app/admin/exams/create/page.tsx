"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam() {

  const [schoolId, setSchoolId] = useState("")
  const [classes, setClasses] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])

  const [examName, setExamName] = useState("")
  const [selectedClass, setSelectedClass] = useState("")



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

      loadClasses(user.school_id)

    }

  }



  async function loadClasses(school: string) {

    const { data } = await supabase
      .from("students")
      .select("class")
      .eq("school_id", school)

    const uniqueClasses = [...new Set(data?.map((s: any) => s.class))]

    setClasses(uniqueClasses as string[])

  }



  async function loadSubjects(className: string) {

    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("class", className)

    setSubjects(data || [])

  }



  async function createExam() {

    if (!examName || !selectedClass) {
      alert("Fill exam name and class")
      return
    }

    const { error } = await supabase
      .from("exams")
      .insert({
        name: examName,
        class: selectedClass,
        school_id: schoolId
      })

    if (error) {
      console.log(error)
      alert("Exam creation failed")
      return
    }

    alert("Exam Created Successfully")

    setExamName("")
    setSelectedClass("")
    setSubjects([])

  }



  return (

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-8">
        Create Exam
      </h1>



      {/* Exam Name */}

      <input
        value={examName}
        onChange={(e) => setExamName(e.target.value)}
        placeholder="Exam Name"
        className="bg-slate-800 p-2 rounded mr-4"
      />



      {/* Class Selection */}

      <select
        value={selectedClass}
        onChange={(e) => {
          setSelectedClass(e.target.value)
          loadSubjects(e.target.value)
        }}
        className="bg-slate-800 p-2 rounded"
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



      {/* Subjects Preview */}

      {subjects.length > 0 && (

        <div className="mt-6">

          <h3 className="text-lg mb-2">
            Subjects
          </h3>

          <ul className="list-disc ml-6">

            {subjects.map((s) => (
              <li key={s.id}>
                {s.name}
              </li>
            ))}

          </ul>

        </div>

      )}



      {/* Create Button */}

      <button
        onClick={createExam}
        className="mt-6 bg-green-600 px-6 py-2 rounded"
      >
        Create Exam
      </button>

    </div>

  )

}