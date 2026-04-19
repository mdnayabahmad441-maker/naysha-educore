"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { fetchReceiptByPaymentId, type ReceiptViewData } from "@/lib/payment-receipts"
import { useParams } from "next/navigation"

export default function ReceiptPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const [data, setData] = useState<ReceiptViewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const receiptData = await fetchReceiptByPaymentId(id)
        if (!cancelled) {
          setData(receiptData)
        }
      } catch (error) {
        console.error(error)
        if (!cancelled) {
          setData(null)
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
  }, [id])

  if (loading) {
    return "Loading..."
  }

  if (!data) {
    return "Receipt not found"
  }

  return (
    <FeeReceipt
      student={data.student}
      fee={data.fee}
      payment={{
        amount: data.payment.amount,
        date: data.payment.payment_date,
        id: data.payment.receipt_number,
        payment_mode: data.payment.payment_mode
      }}
      school={data.school}
    />
  )
}
