"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Exam = {
  id: string
  name: string
  term: string
  date: string
}

export default function CreateExamPage() {

  const schoolId = "1"

  const [name, setName] = useState("")
  const [term, setTerm] = useState("")
  const [date, setDate] = useState("")
  const [exams, setExams] = useState<Exam[]>([])

  async function loadExams() {

    const { data, error } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .order("date", { ascending: false })

    if (!error) setExams(data || [])
  }

  useEffect(() => {
    loadExams()
  }, [])

  async function createExam() {

    if (!name || !term || !date) {
      alert("Please fill all fields")
      return
    }

    const { error } = await supabase
      .from("exams")
      .insert({
        school_id: schoolId,
        name,
        term,
        date
      })

    if (!error) {
      setName("")
      setTerm("")
      setDate("")
      loadExams()
    }
  }

  async function deleteExam(id: string) {

    await supabase
      .from("exams")
      .delete()
      .eq("id", id)

    loadExams()
  }

  return (

    <div className="p-10 text-white max-w-6xl mx-auto">

      <h1 className="text-2xl font-semibold mb-6">
        Create Exam
      </h1>

      {/* FORM CARD */}

      <div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

        <div className="flex gap-4 flex-wrap">

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Exam Name"
            className="bg-gray-800 text-white px-3 py-2 rounded w-48"
          />

          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Term"
            className="bg-gray-800 text-white px-3 py-2 rounded w-40"
          />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <button
            onClick={createExam}
            className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded font-medium"
          >
            Save
          </button>

        </div>

      </div>

      {/* EXAMS TABLE */}

      <div className="overflow-x-auto">

        <table className="min-w-[900px] w-full text-sm">

          <thead>

            <tr className="bg-white/10">

              <th className="p-2 text-left">Exam</th>
              <th className="p-2 text-left">Term</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>

            </tr>

          </thead>

          <tbody>

            {exams.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-gray-400">
                  No exams created yet
                </td>
              </tr>
            )}

            {exams.map((exam) => (

              <tr
                key={exam.id}
                className="border-t border-white/10 hover:bg-white/5"
              >

                <td className="p-2">{exam.name}</td>
                <td className="p-2">{exam.term}</td>
                <td className="p-2">{exam.date}</td>

                <td className="p-2">

                  <button
                    onClick={() => deleteExam(exam.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  )
}