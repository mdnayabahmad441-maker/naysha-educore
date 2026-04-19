"use client"

import Button from "@/components/ui/Button"
import { buildFeeBreakdown } from "@/lib/payment-receipts"

export default function FeeReceipt({ student, fee, payment, school }: any) {

  const print = () => window.print()

  const s = student || {}
  const f = fee || {}
  const p = payment || {}
  const sc = school || {}

  // ✅ CLEAN NUMBERS
  const total = Number(f.total_amount ?? 0)
  const currentPayment = Number(p.amount ?? 0)
  const totalPaid = Number(f.paid_amount ?? currentPayment)
  const previousPaid = Math.max(0, totalPaid - currentPayment)
  const balance = Math.max(0, total - totalPaid)

  // ✅ SAFE DATE
  const date = p.date ? new Date(p.date) : new Date()

  // ✅ CLEAN STUDENT DATA
  const className = s.class_name ?? "N/A"
  const rollNumber = s.roll_number ?? "-"
  const parentName = s.parent_name ?? "N/A"
  const parentPhone = s.parent_phone ?? "N/A"

  // ✅ FIXED BREAKDOWN (IMPORTANT)
  const breakdown = buildFeeBreakdown({
    label: f.label ?? undefined,
    month: f.month ?? null,
    total_amount: Number(f.total_amount ?? 0),
    tuition_fee: Number(f.tuition_fee ?? 0),
    transport_fee: Number(f.transport_fee ?? 0),
    hostel_fee: Number(f.hostel_fee ?? 0)
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-10 text-white">

      {/* HEADER */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-green-400">
          {sc?.name ? sc.name : "School"}
        </h1>

        {sc?.address && <p className="text-sm opacity-70">{sc.address}</p>}
        {sc?.phone && <p className="text-sm opacity-70">{sc.phone}</p>}

        <p className="mt-2 text-sm opacity-70">Fee Payment Receipt</p>
      </div>

      {/* STUDENT */}
      <div className="mb-6 flex justify-between text-sm">

        <div className="space-y-1">
          <p><span className="text-green-400">Name:</span> {s.name ?? "N/A"}</p>
          <p><span className="text-green-400">Class:</span> {className}</p>
          <p><span className="text-green-400">Roll No:</span> {rollNumber}</p>
          <p><span className="text-green-400">Parent:</span> {parentName}</p>
          <p><span className="text-green-400">Phone:</span> {parentPhone}</p>
        </div>

        <div className="space-y-1 text-right">
          <p><span className="text-green-400">Date:</span> {date.toLocaleDateString()}</p>
          <p><span className="text-green-400">Receipt ID:</span> {p.id ?? "N/A"}</p>

          {p.payment_mode && (
            <p><span className="text-green-400">Mode:</span> {p.payment_mode}</p>
          )}
        </div>

      </div>

      {/* BREAKDOWN */}
      <div className="mb-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Fee Type</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {breakdown.map((item:any) => (
              <tr key={item.label} className="border-t border-white/10">
                <td className="p-3">{item.label}</td>
                <td className="p-3 text-right">₹ {item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SUMMARY */}
      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <tbody>

            <tr className="border-t border-white/10">
              <td className="p-3 font-semibold">Total Fee</td>
              <td className="p-3 text-right font-semibold">₹ {total}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-blue-400">Previously Paid</td>
              <td className="p-3 text-right text-blue-400">₹ {previousPaid}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-400">This Payment</td>
              <td className="p-3 text-right text-green-400">₹ {currentPayment}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-300">Total Paid</td>
              <td className="p-3 text-right text-green-300">₹ {totalPaid}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-yellow-400">Balance</td>
              <td className="p-3 text-right text-yellow-400">₹ {balance}</td>
            </tr>

          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-semibold text-green-400">
          {balance <= 0 ? "PAID" : "PARTIAL"}
        </p>

        <p className="text-sm opacity-70">Thank you</p>
      </div>

      {/* PRINT */}
      <div className="mt-6">
        <Button color="blue" onClick={print}>
          Download / Print
        </Button>
      </div>

    </div>
  )
}