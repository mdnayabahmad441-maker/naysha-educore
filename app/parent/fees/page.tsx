"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

type ParentPayment = {
  id: string
  amount: number | string | null
  date: string | null
  receipt_number?: string | null
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function ParentFees() {
  const [payments, setPayments] = useState<ParentPayment[]>([])

  useEffect(() => {
    const load = async () => {
      const studentIds = await getCurrentParentStudentIds()
      if (studentIds.length === 0) return

      const { data } = await supabase
        .from("payments")
        .select("id,amount,date,receipt_number")
        .in("student_id", studentIds)
        .order("date", { ascending: false })

      setPayments((data as ParentPayment[] | null) || [])
    }

    void load()
  }, [])

  return (
    <div className="rounded-xl bg-white/10 p-4 sm:p-6">
      <h1 className="mb-4 text-xl">Fees & Payments</h1>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-white/10 text-sm">
          <thead>
            <tr>
              <th className="border p-2">Date</th>
              <th className="border p-2">Amount</th>
              <th className="border p-2">Receipt No.</th>
              <th className="border p-2">Invoice</th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="border p-2">{formatDate(payment.date)}</td>
                <td className="border p-2">Rs. {payment.amount}</td>
                <td className="border p-2">{payment.receipt_number || payment.id}</td>
                <td className="border p-2">
                  <Link
                    href={`/receipt/${payment.id}`}
                    className="inline-flex rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    View / Download
                  </Link>
                </td>
              </tr>
            ))}

            {payments.length === 0 && (
              <tr>
                <td className="p-4 text-center text-slate-300" colSpan={4}>
                  No fee payments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
