"use client"

import { buildFeeBreakdown } from "@/lib/payment-receipts"

type FeeReceiptProps = {
  student?: {
    name?: string | null
    student_code?: string | null
    class_name?: string | null
    roll_number?: string | number | null
    parent_name?: string | null
    parent_phone?: string | null
    parent_email?: string | null
  } | null
  fee?: {
    total_amount?: number | string | null
    tuition_fee?: number | string | null
    transport_fee?: number | string | null
    hostel_fee?: number | string | null
  } | null
  payment?: {
    id?: string | null
    receipt_number?: string | null
    amount?: number | string | null
    date?: string | null
    payment_mode?: string | null
  } | null
  school?: {
    name?: string | null
    address?: string | null
    phone?: string | null
  } | null
}

export default function FeeReceipt({ student, fee, payment, school }: FeeReceiptProps) {
  const print = () => window.print()
  const breakdown = buildFeeBreakdown(fee)
  const total = breakdown.reduce((sum, item) => sum + item.value, 0)
  const paidAmount = Number(payment?.amount ?? total)
  const receiptNumber = payment?.receipt_number || payment?.id || "N/A"

  return (
    <div className="mx-auto w-full max-w-3xl rounded-lg bg-white p-10 text-black print:max-w-none print:p-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{school?.name || "School"}</h1>

        {school?.address && <p className="text-sm">{school.address}</p>}
        {school?.phone && <p className="text-sm">{school.phone}</p>}
      </div>

      <div className="mb-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_280px] text-sm">
        <div className="space-y-2 min-w-0">
          <p>
            <b>Student Name:</b> {student?.name || "N/A"}
          </p>
          <p>
            <b>Student ID:</b> {student?.student_code || "N/A"}
          </p>
          <p>
            <b>Class:</b> {student?.class_name || "N/A"}
          </p>
          <p>
            <b>Roll No:</b> {student?.roll_number || "N/A"}
          </p>
          <p>
            <b>Parent Name:</b> {student?.parent_name || "N/A"}
          </p>
          <p>
            <b>Parent Phone:</b> {student?.parent_phone || "N/A"}
          </p>
        </div>

        <div className="space-y-2 text-right">
          <p>
            <b>Date:</b>{" "}
            {payment?.date ? new Date(payment.date).toLocaleDateString() : "N/A"}
          </p>
          <p>
            <b>Receipt No:</b> {receiptNumber}
          </p>
          <p>
            <b>Mode:</b> {payment?.payment_mode || "N/A"}
          </p>
        </div>
      </div>

      <table className="mb-4 w-full border-collapse border border-black text-sm">
        <thead>
          <tr className="border-b border-black">
            <th className="p-2 text-left">Fee Head</th>
            <th className="p-2 text-right">Amount (INR)</th>
          </tr>
        </thead>

        <tbody>
          {breakdown.map((item) => (
            <tr key={item.label} className="border-b border-black">
              <td className="p-2">{item.label}</td>
              <td className="p-2 text-right">Rs. {item.value}</td>
            </tr>
          ))}

          <tr>
            <td className="p-2 font-bold">Grand Total</td>
            <td className="p-2 text-right font-bold">Rs. {total}</td>
          </tr>

          <tr>
            <td className="p-2 font-bold">Paid Amount</td>
            <td className="p-2 text-right font-bold">Rs. {paidAmount}</td>
          </tr>
        </tbody>
      </table>

      <p className="mb-6 text-sm">
        This is a computer-generated receipt and valid without signature.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">Accounts Office</p>

        <button
          onClick={print}
          className="rounded bg-black px-4 py-2 text-white print:hidden"
        >
          Print / Download
        </button>
      </div>
    </div>
  )
}
