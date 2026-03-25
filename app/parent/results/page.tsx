"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ParentResults() {

  const [results, setResults] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user

      if (!user?.email) return

      const { data: parent } = await supabase
        .from("parents")
        .select("*")
        .eq("email", user.email)
        .maybeSingle()

      if (!parent) return

      const { data } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", parent.student_id)
        .order("created_at", { ascending: false })

      setResults(data || [])
    }

    load()

  }, [])

  return (
    <div className="bg-white/10 p-6 rounded-xl">

      <h1 className="text-xl mb-4">Results</h1>

      <table className="w-full border border-white/10">

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
  )
}