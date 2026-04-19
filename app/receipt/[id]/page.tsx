"use client"

import { useEffect, useState } from "react"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { fetchReceiptByPaymentId } from "@/lib/payment-receipts"
import { useParams } from "next/navigation"

export default function ReceiptPage() {
  const params = useParams()

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : params?.id

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    let cancelled = false

    const load = async () => {
      setLoading(true)

      try {
        const res = await fetchReceiptByPaymentId(id)

        console.log("RECEIPT DATA:", res) // 🔍 debug

        if (!cancelled) {
          setData(res)
        }
      } catch (err) {
        console.error("Receipt error:", err)
        if (!cancelled) {
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="p-10 text-white">
        Loading receipt...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-10 text-red-500">
        Receipt not found
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#020617] min-h-screen">
      <FeeReceipt
        student={data.student}
        fee={data.fee}
        payment={{
          amount: data.payment?.amount,
          date: data.payment?.date,
          id: data.payment?.receipt_number,
          payment_mode: data.payment?.payment_mode
        }}
        school={data.school}
      />
    </div>
  )
}