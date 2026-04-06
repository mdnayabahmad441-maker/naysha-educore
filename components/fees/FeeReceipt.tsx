"use client"

import Button from "@/components/ui/Button"

export default function FeeReceipt({ student, fee, payment }: any){

  const print = () => window.print()

  const safeStudent = student || {}
  const safeFee = fee || {}
  const safePayment = payment || {}

  const total = Number(safeFee.total_amount || 0)
  const paid = Number(safePayment.amount || safeFee.paid_amount || 0)
  const balance = total - paid

  const safeDate =
    safePayment?.date ||
    safeFee?.created_at ||
    new Date().toISOString()

  // 🔥 BREAKDOWN (CORE FIX)
  const breakdown = [
    { label: "Tuition Fee", value: Number(safeFee.tuition_fee || 0) },
    { label: "Transport Fee", value: Number(safeFee.transport_fee || 0) },
    { label: "Hostel Fee", value: Number(safeFee.hostel_fee || 0) },
  ].filter(item => item.value > 0)

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
          <p><span className="text-green-400">Name:</span> {safeStudent.name || "N/A"}</p>
          <p><span className="text-green-400">Class:</span> {safeStudent.class_name || "N/A"}</p>
          <p><span className="text-green-400">Roll No:</span> {safeStudent.roll_number || "N/A"}</p>
        </div>

        <div className="space-y-1 text-right">
          <p>
            <span className="text-green-400">Date:</span>{" "}
            {new Date(safeDate).toLocaleDateString()}
          </p>
          <p>
            <span className="text-green-400">Receipt ID:</span>{" "}
            {safePayment.id || safeFee.id || "N/A"}
          </p>
        </div>

      </div>

      {/* 🔥 BREAKDOWN TABLE */}
      <div className="overflow-hidden rounded-xl border border-white/10 mb-6">
        <table className="w-full text-sm">

          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Fee Type</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>

            {breakdown.length > 0 ? (
              breakdown.map((item:any)=>(
                <tr key={item.label} className="border-t border-white/10">
                  <td className="p-3">{item.label}</td>
                  <td className="p-3 text-right">₹{item.value}</td>
                </tr>
              ))
            ) : (
              <tr className="border-t border-white/10">
                <td className="p-3">Total Fee</td>
                <td className="p-3 text-right">₹{total}</td>
              </tr>
            )}

          </tbody>

        </table>
      </div>

      {/* 🔥 SUMMARY */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">

          <tbody>

            <tr className="border-t border-white/10">
              <td className="p-3 font-semibold">Total</td>
              <td className="p-3 text-right font-semibold">₹{total}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-400">Paid</td>
              <td className="p-3 text-right text-green-400">₹{paid}</td>
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