"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ExamsPage(){

  const [exams,setExams] = useState<any[]>([])
  const [name,setName] = useState("")
  const [date,setDate] = useState("")

  async function fetchExams(){
    const {data} = await supabase
      .from("exams")
      .select("*")

    if(data) setExams(data)
  }

  useEffect(()=>{
    fetchExams()
  },[])

  async function createExam(){

    await supabase.from("exams").insert([
      {
        name:name,
        exam_date:date
      }
    ])

    setName("")
    setDate("")

    fetchExams()
  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Exam Management
      </h1>

      {/* CREATE EXAM */}

      <div className="bg-white/10 p-6 rounded-xl mb-10 w-[400px]">

        <input
        placeholder="Exam Name"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        />

        <input
        type="date"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
        />

        <button
        onClick={createExam}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Create Exam
        </button>

      </div>

      {/* EXAM LIST */}

      <table className="w-full">

        <thead>
          <tr className="text-left text-gray-400">
            <th>Name</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>

          {exams.map((exam)=>(
            <tr key={exam.id} className="border-t border-gray-700">

              <td>{exam.name}</td>
              <td>{exam.exam_date}</td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  )
}