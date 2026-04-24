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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value?: string | null) {
  if (!value) return "N/A"

  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function FeeReceipt({ student, fee, payment, school }: FeeReceiptProps) {
  const print = () => window.print()
  const breakdown = buildFeeBreakdown(fee)
  const total = breakdown.reduce((sum, item) => sum + item.value, 0)
  const paidAmount = Number(payment?.amount ?? total)
  const receiptNumber = payment?.receipt_number || payment?.id || "N/A"
  const outstanding = Math.max(total - paidAmount, 0)
  const issueDate = formatDate(payment?.date)

  return (
    <div className="mx-auto w-full max-w-4xl bg-[#f4efe6] text-slate-900 print:max-w-none print:bg-white">
      <div className="overflow-visible rounded-[30px] border border-[#d7c9ad] bg-[linear-gradient(180deg,#fffdfa_0%,#f6efe4_100%)] shadow-[0_30px_90px_rgba(15,23,42,0.14)] print:rounded-none print:border-0 print:bg-white print:shadow-none">
        <div className="h-3 bg-[linear-gradient(90deg,#8b6a2f_0%,#d4af63_45%,#7f5c1f_100%)]" />

        <div className="p-7 sm:p-10 print:p-8">
          <div className="flex flex-col gap-6 border-b border-[#d7c9ad] pb-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-[#8b6a2f]">
                Premium Fee Receipt
              </p>
              <h1 className="mt-3 break-words text-3xl font-semibold leading-[1.18] tracking-[-0.02em] text-slate-950 sm:text-[2.35rem]">
                {school?.name || "School"}
              </h1>

              {school?.address ? (
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {school.address}
                </p>
              ) : null}

              {school?.phone ? (
                <p className="mt-1 text-sm font-medium text-slate-700">
                  Contact: {school.phone}
                </p>
              ) : null}
            </div>

            <div className="grid min-w-[250px] gap-3 rounded-[24px] border border-[#d7c9ad] bg-white/80 p-5 text-sm shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Receipt No.</span>
                <span className="text-right font-semibold text-slate-900">{receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Issue Date</span>
                <span className="text-right font-semibold text-slate-900">{issueDate}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-500">Payment Mode</span>
                <span className="text-right font-semibold capitalize text-slate-900">
                  {payment?.payment_mode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-[26px] border border-[#d7c9ad] bg-white/85 p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-slate-950">Student Billing Details</h2>
                <div className="rounded-full bg-[#f7efdd] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8b6a2f]">
                  Verified
                </div>
              </div>

              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Student Name</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Student ID</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.student_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Class</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.class_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Roll Number</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.roll_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Parent / Guardian</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.parent_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Contact Number</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{student?.parent_phone || "N/A"}</p>
                </div>
              </div>

              {student?.parent_email ? (
                <div className="mt-5 border-t border-[#eadfca] pt-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Parent Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{student.parent_email}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-[26px] border border-[#d7c9ad] bg-[linear-gradient(180deg,#fffdfa_0%,#f9f1e3_100%)] p-6 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8b6a2f]">
                Payment Summary
              </p>
              <p className="mt-3 text-4xl font-semibold leading-none text-slate-950">
                {formatCurrency(paidAmount)}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Amount received against the current fee invoice.
              </p>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center justify-between rounded-2xl border border-[#e7d9bd] bg-white/80 px-4 py-3">
                  <span className="text-sm text-slate-600">Gross Fee</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e7d9bd] bg-white/80 px-4 py-3">
                  <span className="text-sm text-slate-600">Paid</span>
                  <span className="text-sm font-semibold text-emerald-700">{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-[#e7d9bd] bg-white/80 px-4 py-3">
                  <span className="text-sm text-slate-600">Outstanding</span>
                  <span className="text-sm font-semibold text-slate-900">{formatCurrency(outstanding)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-8 overflow-hidden rounded-[26px] border border-[#d7c9ad] bg-white/90 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
            <div className="grid grid-cols-[minmax(0,1fr)_180px] bg-[#f9f1e3] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              <div>Fee Head</div>
              <div className="text-right">Amount</div>
            </div>

            <div className="divide-y divide-[#eee2ca]">
              {breakdown.map((item) => (
                <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_180px] px-5 py-4 text-sm">
                  <div className="font-medium text-slate-800">{item.label}</div>
                  <div className="text-right font-semibold text-slate-900">{formatCurrency(item.value)}</div>
                </div>
              ))}

              <div className="grid grid-cols-[minmax(0,1fr)_180px] bg-[#fcf7ee] px-5 py-4 text-sm">
                <div className="font-semibold text-slate-950">Grand Total</div>
                <div className="text-right font-semibold text-slate-950">{formatCurrency(total)}</div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_180px] bg-[#fffaf2] px-5 py-4 text-sm">
                <div className="font-semibold text-slate-950">Paid Amount</div>
                <div className="text-right text-base font-semibold text-[#8b6a2f]">{formatCurrency(paidAmount)}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-[#d7c9ad] pt-6 text-sm text-slate-600 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-medium text-slate-800">Accounts Office</p>
              <p className="mt-2 max-w-2xl leading-6">
                This is a computer-generated premium receipt and is valid without a physical signature or seal.
              </p>
            </div>

            <button
              onClick={print}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 print:hidden"
            >
              Print / Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
