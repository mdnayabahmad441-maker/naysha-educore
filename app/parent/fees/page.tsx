"use client"

import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

export default function ParentFees() {

  const [payments, setPayments] = useState<any[]>([])

  useEffect(() => {

    const load = async () => {

      const studentIds = await getCurrentParentStudentIds()
      if (studentIds.length === 0) return

      const { data } = await supabase
        .from("payments")
        .select("*")
        .in("student_id", studentIds)
        .order("date", { ascending: false })

      setPayments(data || [])
    }

    load()

  }, [])

  return (
    <div className="rounded-xl bg-white/10 p-4 sm:p-6">

      <h1 className="text-xl mb-4">Fees & Payments</h1>

      <div className="overflow-x-auto">
      <table className="min-w-full border border-white/10 text-sm">

        <thead>
          <tr>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Amount</th>
          </tr>
        </thead>

        <tbody>
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="p-2 border">{p.date}</td>
              <td className="p-2 border">₹{p.amount}</td>
            </tr>
          ))}
        </tbody>

      </table>
      </div>

    </div>
  )
}
