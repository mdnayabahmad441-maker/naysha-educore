"use client"

import { buildFeeBreakdown } from "@/lib/payment-receipts"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRef, useState } from "react"

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
    month?: string | null
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
    logo_url?: string | null
  } | null
  showActions?: boolean
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

export default function FeeReceipt({ student, fee, payment, school, showActions = true }: FeeReceiptProps) {
  const receiptRef = useRef<HTMLDivElement | null>(null)
  const [downloading, setDownloading] = useState(false)
  const breakdown = buildFeeBreakdown(fee)
  const total = breakdown.reduce((sum, item) => sum + item.value, 0)
  const paidAmount = Number(payment?.amount ?? total)
  const receiptNumber = payment?.receipt_number || payment?.id || "N/A"
  const outstanding = Math.max(total - paidAmount, 0)
  const issueDate = formatDate(payment?.date)

  const downloadPdf = async () => {
    if (!receiptRef.current) return

    setDownloading(true)

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 1.2,
        useCORS: true,
        backgroundColor: "#f4efe6"
      })
      const img = canvas.toDataURL("image/jpeg", 0.82)
      const pdf = new jsPDF("p", "mm", "a4")
      const maxWidth = 190
      const maxHeight = 281
      let width = maxWidth
      let height = (canvas.height * width) / canvas.width

      if (height > maxHeight) {
        height = maxHeight
        width = (canvas.width * height) / canvas.height
      }

      pdf.addImage(img, "JPEG", (210 - width) / 2, 8, width, height, undefined, "FAST")
      pdf.save(`receipt-${receiptNumber}.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div ref={receiptRef} className="mx-auto w-full max-w-3xl print:max-w-none print:bg-white" style={{ backgroundColor: "#f4efe6", color: "#0f172a" }}>
      <div
        className="overflow-visible rounded-2xl print:rounded-none print:border-0 print:bg-white print:shadow-none"
        style={{
          border: "1px solid #d7c9ad",
          background: "linear-gradient(180deg,#fffdfa 0%,#f6efe4 100%)",
          boxShadow: "0 20px 50px rgba(15,23,42,0.12)"
        }}
      >
        <div className="h-2 bg-[linear-gradient(90deg,#8b6a2f_0%,#d4af63_45%,#7f5c1f_100%)]" />

        <div className="p-3 sm:p-6 print:p-5">
          <div className="flex flex-col gap-4 pb-5 sm:flex-row sm:items-start sm:justify-between" style={{ borderBottom: "1px solid #d7c9ad" }}>
            <div className="flex min-w-0 gap-4">
              {school?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={school.logo_url}
                  alt="School logo"
                  className="h-16 w-16 shrink-0 rounded-xl object-contain"
                  style={{ border: "1px solid #d7c9ad", backgroundColor: "#fff" }}
                />
              ) : null}
              <div className="min-w-0">
                <h1 className="break-words text-2xl font-semibold leading-tight sm:text-3xl" style={{ color: "#020617" }}>
                  {school?.name || "School"}
                </h1>

                {school?.address ? (
                  <p className="mt-2 max-w-2xl text-xs leading-5" style={{ color: "#475569" }}>
                    {school.address}
                  </p>
                ) : null}

                {school?.phone ? (
                  <p className="mt-1 text-xs font-medium" style={{ color: "#334155" }}>
                    Contact: {school.phone}
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className="grid w-full min-w-0 gap-2 rounded-2xl p-3 text-[11px] sm:w-auto sm:min-w-[235px] sm:p-4 sm:text-xs"
              style={{ border: "1px solid #d7c9ad", backgroundColor: "rgba(255,255,255,0.8)", boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}
            >
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: "#64748b" }}>Receipt No.</span>
                <span className="text-right font-semibold" style={{ color: "#0f172a" }}>{receiptNumber}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: "#64748b" }}>Issue Date</span>
                <span className="text-right font-semibold" style={{ color: "#0f172a" }}>{issueDate}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span style={{ color: "#64748b" }}>Payment Mode</span>
                <span className="text-right font-semibold capitalize" style={{ color: "#0f172a" }}>
                  {payment?.payment_mode || "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <section className="rounded-2xl p-4" style={{ border: "1px solid #d7c9ad", backgroundColor: "rgba(255,255,255,0.85)", boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-base font-semibold" style={{ color: "#020617" }}>Student Billing Details</h2>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Student Name</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Class</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.class_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Roll Number</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.roll_number || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Student ID</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.student_code || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Parent / Guardian</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.parent_name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.18em]" style={{ color: "#64748b" }}>Contact Number</p>
                  <p className="mt-1 break-words text-xs font-semibold sm:text-sm" style={{ color: "#0f172a" }}>{student?.parent_phone || "N/A"}</p>
                </div>
              </div>

              {student?.parent_email ? (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid #eadfca" }}>
                  <p className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: "#64748b" }}>Parent Email</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "#334155" }}>{student.parent_email}</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl p-4" style={{ border: "1px solid #d7c9ad", background: "linear-gradient(180deg,#fffdfa 0%,#f9f1e3 100%)", boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}>
              <p className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: "#8b6a2f" }}>
                Payment Summary
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none" style={{ color: "#020617" }}>
                {formatCurrency(paidAmount)}
              </p>

              <div className="mt-4 grid gap-2">
                <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ border: "1px solid #e7d9bd", backgroundColor: "rgba(255,255,255,0.8)" }}>
                  <span className="text-sm" style={{ color: "#475569" }}>Gross Fee</span>
                  <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>{formatCurrency(total)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ border: "1px solid #e7d9bd", backgroundColor: "rgba(255,255,255,0.8)" }}>
                  <span className="text-sm" style={{ color: "#475569" }}>Paid</span>
                  <span className="text-sm font-semibold" style={{ color: "#15803d" }}>{formatCurrency(paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ border: "1px solid #e7d9bd", backgroundColor: "rgba(255,255,255,0.8)" }}>
                  <span className="text-sm" style={{ color: "#475569" }}>Outstanding</span>
                  <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>{formatCurrency(outstanding)}</span>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl" style={{ border: "1px solid #d7c9ad", backgroundColor: "rgba(255,255,255,0.9)", boxShadow: "0 12px 32px rgba(15,23,42,0.06)" }}>
            <div className="grid grid-cols-[minmax(0,1fr)_110px] px-3 py-3 text-xs font-semibold uppercase tracking-[0.14em] sm:grid-cols-[minmax(0,1fr)_150px] sm:px-4 sm:tracking-[0.18em]" style={{ backgroundColor: "#f9f1e3", color: "#334155" }}>
              <div>Fee Head</div>
              <div className="text-right">Amount</div>
            </div>

            <div>
              {breakdown.map((item) => (
                <div key={item.label} className="grid grid-cols-[minmax(0,1fr)_110px] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_150px] sm:px-4" style={{ borderTop: "1px solid #eee2ca" }}>
                  <div className="font-medium" style={{ color: "#1e293b" }}>{item.label}</div>
                  <div className="text-right font-semibold" style={{ color: "#0f172a" }}>{formatCurrency(item.value)}</div>
                </div>
              ))}

              <div className="grid grid-cols-[minmax(0,1fr)_110px] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_150px] sm:px-4" style={{ borderTop: "1px solid #eee2ca", backgroundColor: "#fcf7ee" }}>
                <div className="font-semibold" style={{ color: "#020617" }}>Grand Total</div>
                <div className="text-right font-semibold" style={{ color: "#020617" }}>{formatCurrency(total)}</div>
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_110px] px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_150px] sm:px-4" style={{ borderTop: "1px solid #eee2ca", backgroundColor: "#fffaf2" }}>
                <div className="font-semibold" style={{ color: "#020617" }}>Paid Amount</div>
                <div className="text-right text-base font-semibold" style={{ color: "#8b6a2f" }}>{formatCurrency(paidAmount)}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 pt-4 text-xs sm:flex-row sm:items-end sm:justify-between" style={{ borderTop: "1px solid #d7c9ad", color: "#475569" }}>
            <div>
              <p className="font-medium" style={{ color: "#1e293b" }}>Accounts Office</p>
              <p className="mt-2 max-w-2xl leading-6">
                This is a computer-generated receipt and is valid without a physical signature or seal.
              </p>
            </div>

            {showActions ? (
              <button
                onClick={downloadPdf}
                disabled={downloading}
                data-html2canvas-ignore="true"
                className="rounded-full px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-70 print:hidden"
                style={{ backgroundColor: "#020617" }}
              >
                {downloading ? "Downloading..." : "Download PDF"}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
