"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ResultsPage(){

  const [results,setResults] = useState<any[]>([])

  useEffect(()=>{
    loadResults()
  },[])

  async function loadResults(){

    const { data } = await supabase
      .from("marks")
      .select(`
        *,
        students(name),
        exams(name)
      `)

    setResults(data || [])

  }

  return(

    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Exam Results
      </h1>

      <table className="w-full border border-white/20">

        <thead>

          <tr className="bg-white/10">

            <th className="p-2">Student</th>
            <th className="p-2">Exam</th>
            <th className="p-2">Marks</th>

          </tr>

        </thead>

        <tbody>

          {results.map((r)=>(
            <tr key={r.id}>

              <td className="p-2">
                {r.students?.name}
              </td>

              <td className="p-2 text-center">
                {r.exams?.name}
              </td>

              <td className="p-2 text-center">
                {r.marks}
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>

  )

}