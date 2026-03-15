"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"
import { generateResults, getResults } from "@/services/results.service"

export default function ResultsPage(){

  const [exams,setExams] = useState<any[]>([])
  const [examId,setExamId] = useState("")
  const [rows,setRows] = useState<any[]>([])

  useEffect(()=>{

    const load = async()=>{

      const {data} = await supabase
        .from("exams")
        .select("*")

      setExams(data || [])

    }

    load()

  },[])

  const generate = async()=>{

    if(!examId) return

    await generateResults(examId)

    const data = await getResults(examId)
    setRows(data)

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Results</h1>

      <div className="flex gap-4 mb-6">

        <select
          className="bg-slate-800 border border-white/20 p-2 rounded"
          onChange={(e)=>setExamId(e.target.value)}
        >
          <option>Select Exam</option>

          {exams.map(e=>(
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}

        </select>

        <Button color="purple" onClick={generate}>
          Generate Results
        </Button>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">Rank</th>
              <th className="border p-2">Student</th>
              <th className="border p-2">Total</th>
              <th className="border p-2">%</th>
              <th className="border p-2">Grade</th>
            </tr>
          </thead>

          <tbody>

            {rows.map(r=>{

              let medal = ""
              if(r.rank === 1) medal = "🥇"
              if(r.rank === 2) medal = "🥈"
              if(r.rank === 3) medal = "🥉"

              return(
                <tr key={r.id}>
                  <td className="border p-2">{r.rank} {medal}</td>
                  <td className="border p-2">{r.students?.name}</td>
                  <td className="border p-2">{r.total}</td>
                  <td className="border p-2">{Number(r.percentage).toFixed(2)}</td>
                  <td className="border p-2">{r.grade}</td>
                </tr>
              )

            })}

          </tbody>

        </table>

      </div>

    </div>

  )
}