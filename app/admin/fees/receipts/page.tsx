"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function ReceiptHistoryPage(){

  const [payments,setPayments] = useState<any[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    loadPayments()
  },[])

  const loadPayments = async ()=>{

    // ✅ SAFE QUERY (prevents 400 crash)
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("date",{ ascending:false })

    if(error){
      console.error("Payments fetch error:", error)
      setLoading(false)
      return
    }

    // ✅ manually attach student + fee (safe)
    const enriched = await Promise.all((data || []).map(async (p:any)=>{

      const { data: student } = await supabase
        .from("students")
        .select("name, phone, roll_number")
        .eq("id", p.student_id)
        .single()

      const { data: fee } = await supabase
        .from("fees")
        .select("total_amount, paid_amount")
        .eq("id", p.fee_id)
        .single()

      return {
        ...p,
        students: student,
        fees: fee
      }
    }))

    setPayments(enriched)
    setLoading(false)
  }

  // ================= PDF =================
  const generatePDF = async (payment:any)=>{

    const container = document.createElement("div")

    container.style.position = "fixed"
    container.style.top = "-9999px"
    container.style.left = "-9999px"
    container.style.background = "#0f172a"
    container.style.padding = "30px"
    container.style.color = "white"
    container.style.width = "400px"
    container.style.fontFamily = "Arial"

    container.innerHTML = `
      <div style="text-align:center;margin-bottom:20px">
        <h2>Fee Receipt</h2>
      </div>

      <p><b>Name:</b> ${payment.students?.name || "-"}</p>
      <p><b>Roll:</b> ${payment.students?.roll_number || "-"}</p>
      <p><b>Amount Paid:</b> ₹${payment.amount}</p>
      <p><b>Date:</b> ${new Date(payment.date).toLocaleDateString()}</p>
    `

    document.body.appendChild(container)

    const canvas = await html2canvas(container,{
      backgroundColor:"#0f172a",
      scale:2
    })

    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    pdf.addImage(img,"PNG",10,10,190,0)

    pdf.save(`receipt-${payment.id}.pdf`)

    document.body.removeChild(container)
  }

  // ================= WHATSAPP =================
  const resendWhatsApp = async (payment:any)=>{

    if(!payment.students?.phone){
      alert("No phone number")
      return
    }

    const pdfUrl = window.location.origin

    try{
      await fetch("/api/send-whatsapp",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          to: payment.students.phone,
          studentName: payment.students.name,
          pdfUrl
        })
      })

      alert("Sent again ✅")
    }catch{
      alert("Failed ❌")
    }
  }

  // ================= UI =================
  return(
    <div className="p-6 bg-[#020617] min-h-screen text-white">

      <h1 className="text-2xl font-bold mb-6">Receipt History</h1>

      {loading ? "Loading..." : (

        <div className="space-y-4">

          {payments.map(p=>(

            <div
              key={p.id}
              className="p-4 bg-[#0f172a] border border-white/10 rounded-xl flex justify-between items-center"
            >

              <div>
                <p className="font-semibold text-lg">
                  {p.students?.name || "Unknown"}
                </p>

                <p className="text-green-400 font-medium">
                  ₹{p.amount}
                </p>

                <p className="text-sm text-gray-400">
                  {new Date(p.date).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  onClick={()=>generatePDF(p)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Download
                </button>

                <button
                  onClick={()=>resendWhatsApp(p)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded"
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