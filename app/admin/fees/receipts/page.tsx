"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { fetchReceiptByPaymentId } from "@/lib/payment-receipts"
import { getSchoolId } from "@/lib/school"
import { apiFetch } from "@/lib/api-client"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { createRoot } from "react-dom/client"

type PaymentItem = {
  id: string
  amount: number
  paymentDate: string
  receiptNumber: string
  studentName: string
  studentClass: string | null
  feeLabel: string
}

export default function ReceiptHistoryPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [schoolId, setSchoolId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    void getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const res = await apiFetch("/api/payments-history")

        if (!res.ok) {
          throw new Error("Failed to load receipt history")
        }

        const data = (await res.json()) as PaymentItem[]

        if (!cancelled) {
          setPayments(data || [])
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setPayments([])
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [schoolId])

  const generatePDF = async (paymentId: string) => {
    setBusyId(paymentId)

    let container: HTMLDivElement | null = null
    let root: ReturnType<typeof createRoot> | null = null

    try {
      const receiptData = await fetchReceiptByPaymentId(paymentId)

      if (!receiptData) {
        alert("Receipt not found")
        return
      }

      container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "0"
      container.style.left = "-10000px"
      container.style.width = "800px"
      container.style.padding = "24px"
      container.style.background = "#ffffff"
      container.style.overflow = "visible"
      document.body.appendChild(container)

      root = createRoot(container)
      root.render(
        <FeeReceipt
          student={receiptData.student}
          fee={receiptData.fee}
          payment={receiptData.payment}
          school={receiptData.school}
          showActions={false}
        />
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)
      await new Promise((resolve) => setTimeout(resolve, 120))

      const canvas = await html2canvas(container, { scale: 2, useCORS: true })
      const img = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const width = 190
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img, "PNG", 10, 10, width, height)
      pdf.save(`receipt-${receiptData.payment.receipt_number}.pdf`)
    } catch (err) {
      console.error(err)
      alert("Failed to generate receipt")
    } finally {
      root?.unmount()
      container?.remove()
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Receipt History</h1>

      {loading ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <p className="text-gray-400">No receipts found</p>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f172a] p-4"
            >
              <div>
                <p className="text-lg font-semibold">{payment.studentName}</p>
                <p className="text-sm text-gray-400">
                  {payment.studentClass || "No class"}
                </p>
                <p className="font-medium text-green-400">
                  Rs. {payment.amount}
                </p>
                <p className="text-sm text-gray-400">
                  {payment.paymentDate
                    ? new Date(payment.paymentDate).toLocaleString()
                    : "No date"}
                </p>
                <p className="text-sm text-blue-400">
                  {payment.receiptNumber} - {payment.feeLabel}
                </p>
              </div>

              <button
                onClick={() => generatePDF(payment.id)}
                disabled={busyId === payment.id}
                className="rounded bg-blue-600 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busyId === payment.id ? "Generating..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
