"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateExam() {
  const [name, setName] = useState("")
  const [term, setTerm] = useState("")
  const [date, setDate] = useState("")
  const [exams, setExams] = useState<any[]>([])

  async function load() {
    const { data } = await supabase.from("exams").select("*")
    setExams(data || [])
  }

  useEffect(() => {
    load()
  }, [])

  async function createExam() {
    await supabase.from("exams").insert({
      name,
      term,
      date
    })
    setName("")
    load()
  }

  async function deleteExam(id: string) {
    await supabase.from("exams").delete().eq("id", id)
    load()
  }

  return (
    <div className="p-8 space-y-6">

      <h1 className="text-xl font-bold">Create Exam</h1>

      <div className="flex gap-4">

        <input
          placeholder="Exam Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="border p-2"
        />

        <input
          placeholder="Term"
          value={term}
          onChange={(e)=>setTerm(e.target.value)}
          className="border p-2"
        />

        <input
          type="date"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          className="border p-2"
        />

        <button
          onClick={createExam}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save
        </button>

      </div>

      <table className="w-full border">

        <thead>
          <tr className="bg-gray-100">
            <th>Name</th>
            <th>Term</th>
            <th>Date</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          {exams.map((exam)=>(
            <tr key={exam.id} className="border-t">
              <td>{exam.name}</td>
              <td>{exam.term}</td>
              <td>{exam.date}</td>
              <td>
                <button
                  onClick={()=>deleteExam(exam.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  )
}