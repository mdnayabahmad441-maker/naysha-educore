"use client"

import Button from "@/components/ui/Button"

export default function FeeReceipt({ student, fee, payment }: any){

  const print = () => window.print()

  const balance = fee.total_amount - fee.paid_amount

  return(

    <div className="bg-[#0b1220] text-white p-10 rounded-2xl border border-white/10">

      {/* HEADER */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-green-400">NaySha School</h1>
        <p className="text-sm opacity-70">Fee Payment Receipt</p>
      </div>

      {/* STUDENT INFO */}
      <div className="flex justify-between mb-6 text-sm">

        <div className="space-y-1">
          <p><span className="text-green-400">Name:</span> {student.name}</p>
          <p><span className="text-green-400">Class:</span> {student.class_name}</p>
          <p><span className="text-green-400">Roll No:</span> {student.roll_number}</p>
        </div>

        <div className="space-y-1 text-right">
          <p><span className="text-green-400">Date:</span> {new Date(payment.date).toLocaleDateString()}</p>
          <p><span className="text-green-400">Receipt ID:</span> {payment.id}</p>
        </div>

      </div>

      {/* TABLE */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">

          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Description</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>

            <tr className="border-t border-white/10">
              <td className="p-3">Total Fee</td>
              <td className="p-3 text-right">₹{fee.total_amount}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-400">Paid</td>
              <td className="p-3 text-right text-green-400">₹{payment.amount}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-yellow-400">Balance</td>
              <td className="p-3 text-right text-yellow-400">₹{balance}</td>
            </tr>

          </tbody>

        </table>
      </div>

      {/* STATUS */}
      <div className="mt-6 flex justify-between items-center">

        <p className="text-lg font-semibold text-green-400">
          {balance <= 0 ? "PAID" : "PARTIAL"}
        </p>

        <p className="text-sm opacity-70">Thank you</p>

      </div>

      {/* ACTION */}
      <div className="mt-6">
        <Button color="blue" onClick={print}>
          Download / Print
        </Button>
      </div>

    </div>
  )
}