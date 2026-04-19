"use client"

import { useEffect, useState } from "react"
import { fetchReceiptByPaymentId } from "@/lib/payment-receipts"
import { getSchoolId } from "@/lib/school"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

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

  // 🔹 Load payments
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

  // ✅ FIXED PDF GENERATION
  const generatePDF = async (paymentId: string) => {
    setBusyId(paymentId)

    try {
      const receiptData = await fetchReceiptByPaymentId(paymentId)

      if (!receiptData) {
        alert("Receipt not found")
        return
      }

      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "-9999px"
      container.style.width = "800px"
      document.body.appendChild(container)

      container.innerHTML = `
        <div style="padding:20px;font-family:sans-serif">
          <h2>${receiptData.school.name}</h2>
          <p><b>Student:</b> ${receiptData.student.name}</p>
          <p><b>Class:</b> ${receiptData.student.class_name}</p>
          <p><b>Amount:</b> ₹${receiptData.payment.amount}</p>
          <p><b>Receipt No:</b> ${receiptData.payment.id}</p>
        </div>
      `

      const canvas = await html2canvas(container, { scale: 2 })
      const img = canvas.toDataURL("image/png")

      const pdf = new jsPDF("p", "mm", "a4")

      const width = 190
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img, "PNG", 10, 10, width, height)
      pdf.save(`receipt-${receiptData.payment.id}.pdf`)

      container.remove()

    } catch (err) {
      console.error(err)
      alert("Failed to generate receipt")
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
                  ₹{p.amount}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(p.paymentDate).toLocaleString()}
                </p>
                <p className="text-blue-400 text-sm">
                  {p.receiptNumber} • {p.feeLabel}
                </p>
              </div>

              <button
                onClick={() => generatePDF(p.id)}
                disabled={busyId === p.id}
                className="bg-blue-600 px-3 py-1 rounded"
              >
                {busyId === p.id ? "Generating..." : "Download"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}