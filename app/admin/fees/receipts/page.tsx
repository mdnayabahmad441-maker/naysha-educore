"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { getSchoolId } from "@/lib/school"

export default function ReceiptHistoryPage(){

  const [payments,setPayments] = useState<any[]>([])
  const [loading,setLoading] = useState(true)
  const [schoolId,setSchoolId] = useState<string | null>(null)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return
    loadPayments()
  },[schoolId])

  // ================= LOAD PAYMENTS (FIXED) =================
  const loadPayments = async ()=>{

    setLoading(true)

    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        students (
          id,
          name,
          roll_number,
          phone
        ),
        fees (
          total_amount,
          paid_amount,
          tuition_fee,
          transport_fee,
          hostel_fee
        )
      `)
      .eq("school_id", schoolId) // ✅ CRITICAL FIX
      .order("date",{ ascending:false })

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    setPayments(data || [])
    setLoading(false)
  }

  // ================= PDF =================
  const generatePDF = async (payment:any)=>{

    const { data: school } = await supabase
      .from("schools")
      .select("*")
      .eq("id", payment.school_id)
      .single()

    const verifyUrl = `${window.location.origin}/verify-receipt/${payment.id}`
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${verifyUrl}`

    const container = document.createElement("div")

    container.style.position = "fixed"
    container.style.top = "-9999px"
    container.style.width = "800px"
    container.style.padding = "30px"
    container.style.background = "#ffffff"
    container.style.color = "#000"

    container.innerHTML = `
      <div style="border:2px solid #000; padding:20px">

        <div style="display:flex; justify-content:space-between; align-items:center">

          <img src="${school?.logo_url || ""}" style="height:60px"/>

          <div style="text-align:center">
            <h2>${school?.name || "School"}</h2>
            <p style="font-size:12px">${school?.address || ""}</p>
          </div>

          <img src="${qr}" />
        </div>

        <hr/>

        <h3 style="text-align:center">FEE RECEIPT</h3>

        <div style="display:flex; justify-content:space-between; margin-top:20px">

          <div>
            <p><b>Name:</b> ${payment.students?.name || "Unknown"}</p>
            <p><b>Roll:</b> ${payment.students?.roll_number || "-"}</p>
            <p><b>Date:</b> ${new Date(payment.date).toLocaleDateString()}</p>
          </div>

        </div>

        <table style="width:100%; border-collapse:collapse; margin-top:20px">
          <tr>
            <th style="border:1px solid #000;padding:8px">Fee</th>
            <th style="border:1px solid #000;padding:8px">Amount</th>
          </tr>

          <tr>
            <td style="border:1px solid #000;padding:8px">Tuition</td>
            <td style="border:1px solid #000;padding:8px">
              ₹${payment.fees?.tuition_fee || 0}
            </td>
          </tr>

          ${
            payment.fees?.transport_fee ? `
            <tr>
              <td style="border:1px solid #000;padding:8px">Transport</td>
              <td style="border:1px solid #000;padding:8px">
                ₹${payment.fees.transport_fee}
              </td>
            </tr>` : ""
          }

          ${
            payment.fees?.hostel_fee ? `
            <tr>
              <td style="border:1px solid #000;padding:8px">Hostel</td>
              <td style="border:1px solid #000;padding:8px">
                ₹${payment.fees.hostel_fee}
              </td>
            </tr>` : ""
          }

        </table>

        <div style="text-align:right;margin-top:10px">
          <h3>Total Paid: ₹${payment.amount}</h3>
        </div>

        <p style="text-align:center;margin-top:20px;font-size:12px">
          Scan QR to verify receipt
        </p>

      </div>
    `

    document.body.appendChild(container)

    const canvas = await html2canvas(container,{
      scale:2,
      useCORS:true,
      backgroundColor:"#ffffff"
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

    await fetch("/api/send-whatsapp",{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        to: payment.students.phone,
        studentName: payment.students.name || "Student",
        pdfUrl: `${window.location.origin}/api/receipt/${payment.id}`
      })
    })

    alert("Sent again ✅")
  }

  return(
    <div className="p-6 min-h-screen bg-[#020617] text-white">

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