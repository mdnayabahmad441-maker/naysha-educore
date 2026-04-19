"use client"

import { buildFeeBreakdown } from "@/lib/payment-receipts"

export default function FeeReceipt({ student, fee, payment, school }: any) {
  const print = () => window.print()

  const breakdown = buildFeeBreakdown(fee)

  const total = breakdown.reduce((sum: number, i: any) => sum + i.value, 0)

  return (
    <div className="bg-white text-black p-10 max-w-3xl mx-auto rounded-lg">

      {/* HEADER */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">
          {school?.name || "DEEP ENGLISH SCHOOL"}
        </h1>
        <p className="text-sm">
          Excellence in Education • Discipline • Character
        </p>
      </div>

      {/* TOP INFO */}
      <div className="flex justify-between text-sm mb-4">
        <div>
          <p><b>Student Name:</b> {student?.name || "N/A"}</p>
          <p><b>Class:</b> {student?.class_name || "N/A"}</p>
          <p><b>Roll No:</b> {student?.roll_number || "N/A"}</p>
          <p><b>Father's Name:</b> {student?.parent_name || "N/A"}</p>
        </div>

        <div className="text-right">
          <p><b>Date:</b> {new Date(payment?.date).toLocaleDateString()}</p>
          <p><b>Receipt No:</b> {payment?.id}</p>
        </div>
      </div>

      {/* TABLE */}
      <table className="w-full border border-black text-sm mb-4">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left p-2">Fee Head</th>
            <th className="text-right p-2">Amount (INR)</th>
          </tr>
        </thead>

        <tbody>
          {breakdown.map((item: any) => (
            <tr key={item.label} className="border-b border-black">
              <td className="p-2">{item.label}</td>
              <td className="p-2 text-right">{item.value}</td>
            </tr>
          ))}

          <tr>
            <td className="p-2 font-bold">Grand Total</td>
            <td className="p-2 text-right font-bold">{total}</td>
          </tr>
        </tbody>
      </table>

      {/* FOOTER */}
      <p className="text-sm mb-6">
        Received with thanks towards institutional dues. This is a computer-generated receipt and valid without signature.
      </p>

      <div className="flex justify-between">
        <p className="text-sm">Authorized Accounts Office</p>
        <button
          onClick={print}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Print / Download
        </button>
      </div>
    </div>
  )
}