"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { fetchReceiptByPaymentId } from "@/lib/payment-receipts"
import { getSchoolId } from "@/lib/school"
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

  // 🔹 Get school
  useEffect(() => {
    getSchoolId().then(setSchoolId)
  }, [])

  // 🔹 Load payments (NEW API)
  useEffect(() => {
    if (!schoolId) return

    const load = async () => {
      setLoading(true)

      try {
        const res = await fetch(`/api/payments-history?school_id=${schoolId}`)
        const data = await res.json()

        setPayments(data || [])
      } catch (err) {
        console.error(err)
        setPayments([])
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [schoolId])

  // 📄 PDF GENERATE
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

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#ffffff"
      })

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

  // 📲 WHATSAPP
  const resendWhatsApp = async (paymentId: string) => {
    setBusyId(paymentId)

    try {
      const receiptData = await fetchReceiptByPaymentId(paymentId)

      if (!receiptData?.student.parent_phone) {
        alert("No parent phone")
        return
      }

      await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          phone: receiptData.student.parent_phone,
          message: `${receiptData.school?.name || "School"}

Receipt for ${receiptData.student.name}
Amount: Rs. ${receiptData.payment.amount}
Receipt No: ${receiptData.payment.receipt_number}`
        })
      })

      alert("Sent successfully")
    } catch (err) {
      console.error(err)
      alert("Failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] p-6 text-white">
      <h1 className="mb-6 text-2xl font-bold">Receipt History</h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0f172a] p-4"
            >
              <div>
                <p className="text-lg font-semibold">{p.studentName}</p>
                <p className="text-sm text-gray-400">
                  {p.studentClass || "No class"}
                </p>
                <p className="text-green-400 font-medium">
                  Rs. {p.amount}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(p.paymentDate).toLocaleString()}
                </p>
                <p className="text-blue-400 text-sm">
                  {p.receiptNumber} • {p.feeLabel}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => generatePDF(p.id)}
                  disabled={busyId === p.id}
                  className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700"
                >
                  Download
                </button>

                <button
                  onClick={() => resendWhatsApp(p.id)}
                  disabled={busyId === p.id}
                  className="bg-green-600 px-3 py-1 rounded hover:bg-green-700"
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