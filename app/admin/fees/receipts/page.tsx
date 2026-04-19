"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import {
  fetchReceiptByPaymentId,
  fetchReceiptHistoryForSchool,
  type ReceiptHistoryItem
} from "@/lib/payment-receipts"
import { getSchoolId } from "@/lib/school"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { createRoot } from "react-dom/client"

export default function ReceiptHistoryPage() {
  const [payments, setPayments] = useState<ReceiptHistoryItem[]>([])
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
        const rows = await fetchReceiptHistoryForSchool(schoolId)
        if (!cancelled) {
          setPayments(rows)
        }
      } catch (error) {
        console.error(error)
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
      container.style.top = "-9999px"
      container.style.width = "800px"
      document.body.appendChild(container)

      root = createRoot(container)
      root.render(
        <FeeReceipt
          student={receiptData.student}
          fee={receiptData.fee}
          payment={{
            amount: receiptData.payment.amount,
            date: receiptData.payment.date,
            id: receiptData.payment.receipt_number,
            payment_mode: receiptData.payment.payment_mode
          }}
          school={receiptData.school}
        />
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)

      container.querySelectorAll<HTMLElement>("*").forEach((element) => {
        element.style.color = "#000"
        element.style.background = "#fff"
        element.style.borderColor = "#000"
        element.style.boxShadow = "none"
      })

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff"
      })

      const img = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const width = 190
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img, "PNG", 10, 10, width, height)
      pdf.save(`receipt-${receiptData.payment.receipt_number}.pdf`)
    } catch (error) {
      console.error(error)
      alert("Failed to generate receipt")
    } finally {
      root?.unmount()
      if (container?.parentNode) {
        container.parentNode.removeChild(container)
      }
      setBusyId(null)
    }
  }

  const resendWhatsApp = async (paymentId: string) => {
    setBusyId(paymentId)

    try {
      const receiptData = await fetchReceiptByPaymentId(paymentId)

      if (!receiptData?.student.parent_phone) {
        alert("No parent phone number found")
        return
      }

      const response = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: receiptData.student.parent_phone,
          message: `${receiptData.school?.name || "School"}\n\nPayment receipt for ${
            receiptData.student.name
          }\nReceipt: ${receiptData.payment.receipt_number}\nAmount: Rs. ${
            receiptData.payment.amount
          }\nView receipt: ${window.location.origin}/receipt/${paymentId}`
        })
      })

      if (!response.ok) {
        throw new Error("WhatsApp send failed")
      }

      alert("Sent again")
    } catch (error) {
      console.error(error)
      alert("Failed to send WhatsApp")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Receipt History</h1>

      {loading ? (
        "Loading..."
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
                  {payment.studentClass || "Class not assigned"}
                </p>
                <p className="font-medium text-green-400">Rs. {payment.amount}</p>
                <p className="text-sm text-gray-400">
                  {new Date(payment.paymentDate).toLocaleString()}
                </p>
                <p className="text-sm text-blue-400">
                  {payment.receiptNumber} • {payment.feeLabel}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generatePDF(payment.id)}
                  disabled={busyId === payment.id}
                  className="rounded bg-blue-600 px-3 py-1 hover:bg-blue-700 disabled:opacity-60"
                >
                  Download
                </button>

                <button
                  onClick={() => resendWhatsApp(payment.id)}
                  disabled={busyId === payment.id}
                  className="rounded bg-green-600 px-3 py-1 hover:bg-green-700 disabled:opacity-60"
                >
                  WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
