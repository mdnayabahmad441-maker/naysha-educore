"use client"

import Button from "@/components/ui/Button"
import { buildFeeBreakdown, type ReceiptFee, type ReceiptSchool } from "@/lib/payment-receipts"

type FeeReceiptProps = {
  student?: {
    id?: string
    name?: string | null
    classes?: { name?: string | null } | null
    parents?: { name?: string | null; phone?: string | null } | null
    class_name?: string | null
    roll_number?: number | string | null
    parent_name?: string | null
    parent_phone?: string | null
  }
  fee?: Partial<ReceiptFee>
  payment?: {
    amount?: number | null
    date?: string | null
    id?: string | null
    payment_mode?: string | null
  }
  school?: Partial<ReceiptSchool> | null
}

export default function FeeReceipt({
  student,
  fee,
  payment,
  school
}: FeeReceiptProps) {
  const print = () => window.print()

  const safeStudent = student || {}
  const safeFee = fee || {}
  const safePayment = payment || {}
  const safeSchool = school || {}

  const total = Number(safeFee.total_amount || 0)
  const currentPayment = Number(safePayment.amount || 0)
  const totalPaid = Number(safeFee.paid_amount || currentPayment || 0)
  const previousPaid = Math.max(0, totalPaid - currentPayment)
  const balance = Math.max(0, total - totalPaid)

  const safeDate =
    safePayment.date || safeFee.month || new Date().toISOString()

  const className =
    safeStudent.class_name || safeStudent.classes?.name || "N/A"
  const rollNumber = safeStudent.roll_number || "-"
  const parentName =
    safeStudent.parent_name || safeStudent.parents?.name || "N/A"
  const parentPhone =
    safeStudent.parent_phone || safeStudent.parents?.phone || "N/A"

  const breakdown = buildFeeBreakdown({
    label: safeFee.label || undefined,
    month: safeFee.month || null,
    total_amount: safeFee.total_amount || 0,
    tuition_fee: safeFee.tuition_fee || 0,
    transport_fee: safeFee.transport_fee || 0,
    hostel_fee: safeFee.hostel_fee || 0
  })

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0b1220] p-10 text-white">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-green-400">
          {safeSchool.name || "School"}
        </h1>

        <p className="text-sm opacity-70">{safeSchool.address || ""}</p>
        <p className="text-sm opacity-70">{safeSchool.phone || ""}</p>
        <p className="mt-2 text-sm opacity-70">Fee Payment Receipt</p>
      </div>

      <div className="mb-6 flex justify-between text-sm">
        <div className="space-y-1">
          <p>
            <span className="text-green-400">Name:</span>{" "}
            {safeStudent.name || "N/A"}
          </p>

          <p>
            <span className="text-green-400">Class:</span> {className}
          </p>

          <p>
            <span className="text-green-400">Roll No:</span> {rollNumber}
          </p>

          <p>
            <span className="text-green-400">Parent:</span> {parentName}
          </p>

          <p>
            <span className="text-green-400">Phone:</span> {parentPhone}
          </p>
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

          {safePayment.payment_mode && (
            <p>
              <span className="text-green-400">Mode:</span>{" "}
              {safePayment.payment_mode}
            </p>
          )}
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="p-3 text-left">Fee Type</th>
              <th className="p-3 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {breakdown.map((item) => (
              <tr key={item.label} className="border-t border-white/10">
                <td className="p-3">{item.label}</td>
                <td className="p-3 text-right">Rs. {item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t border-white/10">
              <td className="p-3 font-semibold">Total Fee</td>
              <td className="p-3 text-right font-semibold">Rs. {total}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-blue-400">Previously Paid</td>
              <td className="p-3 text-right text-blue-400">Rs. {previousPaid}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-400">This Payment</td>
              <td className="p-3 text-right text-green-400">Rs. {currentPayment}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-green-300">Total Paid</td>
              <td className="p-3 text-right text-green-300">Rs. {totalPaid}</td>
            </tr>

            <tr className="border-t border-white/10">
              <td className="p-3 text-yellow-400">Balance</td>
              <td className="p-3 text-right text-yellow-400">Rs. {balance}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-semibold text-green-400">
          {balance <= 0 ? "PAID" : "PARTIAL"}
        </p>

        <p className="text-sm opacity-70">Thank you</p>
      </div>

      <div className="mt-6">
        <Button color="blue" onClick={print}>
          Download / Print
        </Button>
      </div>
    </div>
  )
}
