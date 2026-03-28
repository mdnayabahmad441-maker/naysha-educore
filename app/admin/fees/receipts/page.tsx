"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function ReceiptHistoryPage(){

  const [payments,setPayments] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  const receiptRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    loadPayments()
  },[])

  const loadPayments = async ()=>{
    const { data } = await supabase
      .from("payments")
      .select(`
        *,
        students(name, phone, roll_number),
        fees(total_amount, paid_amount)
      `)
      .order("date",{ ascending:false })

    setPayments(data || [])
    setLoading(false)
  }

  // ================= PDF GENERATION =================
  const generatePDF = async (payment:any)=>{

    const container = document.createElement("div")
    container.style.position = "fixed"
    container.style.top = "-9999px"
    container.style.background = "#0b1220"
    container.style.padding = "40px"
    container.style.color = "white"

    container.innerHTML = `
      <h2>Fee Receipt</h2>
      <p>Name: ${payment.students?.name}</p>
      <p>Roll: ${payment.students?.roll_number}</p>
      <p>Amount Paid: ₹${payment.amount}</p>
      <p>Date: ${new Date(payment.date).toLocaleDateString()}</p>
    `

    document.body.appendChild(container)

    const canvas = await html2canvas(container)
    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    pdf.addImage(img,"PNG",0,0,210,297)

    pdf.save(`receipt-${payment.id}.pdf`)

    document.body.removeChild(container)
  }

  // ================= WHATSAPP RESEND =================
  const resendWhatsApp = async (payment:any)=>{

    const pdfUrl = window.location.origin // you can improve later

    await fetch("/api/send-whatsapp",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        to: payment.students?.phone,
        studentName: payment.students?.name,
        pdfUrl
      })
    })

    alert("Sent again ✅")
  }

  // ================= UI =================
  return(
    <div className="p-6 bg-[#0b1220] min-h-screen text-white">

      <h1 className="text-2xl mb-6">Receipt History</h1>

      {loading ? "Loading..." : (

        <div className="space-y-4">

          {payments.map(p=>(
            <div key={p.id} className="p-4 border rounded flex justify-between items-center">

              <div>
                <p className="font-semibold">{p.students?.name}</p>
                <p>₹{p.amount}</p>
                <p className="text-sm text-gray-400">
                  {new Date(p.date).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  onClick={()=>generatePDF(p)}
                  className="px-3 py-1 bg-blue-600 rounded"
                >
                  Download
                </button>

                <button
                  onClick={()=>resendWhatsApp(p)}
                  className="px-3 py-1 bg-green-600 rounded"
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