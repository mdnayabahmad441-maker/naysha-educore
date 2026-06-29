"use client"

import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

export default function ParentResults() {

  const [results, setResults] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const studentIds = await getCurrentParentStudentIds()
      if (studentIds.length === 0) return

      const { data } = await supabase
        .from("results")
        .select("*")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false })

      setResults(data || [])
    }

    load()

  }, [])

  return (
    <div className="rounded-xl bg-white/10 p-4 sm:p-6">

      <h1 className="text-xl mb-4">Results</h1>

      <div className="overflow-x-auto">
      <table className="min-w-full border border-white/10 text-sm">

        <thead>
          <tr>
            <th className="p-2 border">Exam</th>
            <th className="p-2 border">Total</th>
            <th className="p-2 border">%</th>
            <th className="p-2 border">Grade</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">{r.exam_id}</td>
              <td className="p-2 border">{r.total}</td>
              <td className="p-2 border">
                {r.percentage ? r.percentage.toFixed(1) : 0}%
              </td>
              <td className="p-2 border">{r.grade}</td>
            </tr>
          ))}
        </tbody>

      </table>
      </div>

    </div>
  )
}
