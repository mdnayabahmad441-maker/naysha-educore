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
  const [school,setSchool] = useState<any>(null)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return

    loadPayments()
    loadSchool()

  },[schoolId])

  // ================= LOAD SCHOOL =================
  const loadSchool = async ()=>{
    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single()

    setSchool(data)
  }

  // ================= LOAD PAYMENTS =================
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
          phone,
          classes(name),
          parents(name,phone)
        ),
        fees (
          total_amount,
          paid_amount,
          tuition_fee,
          transport_fee,
          hostel_fee
        )
      `)
      .eq("school_id", schoolId)
      .order("date",{ ascending:false })

    if(error){
      console.error(error)
      setLoading(false)
      return
    }

    setPayments(data || [])
    setLoading(false)
  }

  // ================= PDF (MATCHES FeeReceipt) =================
  const generatePDF = async (payment:any)=>{

    const container = document.createElement("div")

    container.style.position = "fixed"
    container.style.top = "-9999px"
    container.style.width = "800px"
    container.style.padding = "40px"
    container.style.background = "#ffffff"
    container.style.color = "#000"

    const student = payment.students || {}
    const fee = payment.fees || {}

    const total = Number(fee.total_amount || 0)
    const paid = Number(payment.amount || 0)
    const balance = total - paid

    const breakdown = [
      { label: "Tuition Fee", value: fee.tuition_fee || 0 },
      { label: "Transport Fee", value: fee.transport_fee || 0 },
      { label: "Hostel Fee", value: fee.hostel_fee || 0 },
    ].filter(i=>i.value > 0)

    container.innerHTML = `
      <div style="border:2px solid #000;padding:20px">

        <div style="text-align:center">
          <h2>${school?.name || "School"}</h2>
          <p>${school?.address || ""}</p>
          <p>${school?.phone || ""}</p>
          <h3>Fee Receipt</h3>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:20px">

          <div>
            <p><b>Name:</b> ${student.name || "N/A"}</p>
            <p><b>Class:</b> ${student.classes?.name || "N/A"}</p>
            <p><b>Roll:</b> ${student.roll_number || "-"}</p>
            <p><b>Parent:</b> ${student.parents?.name || "N/A"}</p>
            <p><b>Phone:</b> ${student.parents?.phone || "N/A"}</p>
          </div>

          <div style="text-align:right">
            <p><b>Date:</b> ${new Date(payment.date).toLocaleDateString()}</p>
            <p><b>Receipt:</b> ${payment.id}</p>
          </div>

        </div>

        <table style="width:100%;margin-top:20px;border-collapse:collapse">
          <tr>
            <th style="border:1px solid #000;padding:8px">Fee</th>
            <th style="border:1px solid #000;padding:8px">Amount</th>
          </tr>

          ${
            breakdown.length > 0
            ? breakdown.map(b=>`
              <tr>
                <td style="border:1px solid #000;padding:8px">${b.label}</td>
                <td style="border:1px solid #000;padding:8px">₹${b.value}</td>
              </tr>
            `).join("")
            : `
              <tr>
                <td style="border:1px solid #000;padding:8px">Total Fee</td>
                <td style="border:1px solid #000;padding:8px">₹${total}</td>
              </tr>
            `
          }

        </table>

        <div style="margin-top:15px;text-align:right">
          <p><b>Total:</b> ₹${total}</p>
          <p style="color:green"><b>Paid:</b> ₹${paid}</p>
          <p style="color:orange"><b>Balance:</b> ₹${balance}</p>
        </div>

        <p style="margin-top:20px;text-align:center">
          ${balance <= 0 ? "PAID" : "PARTIAL"}
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
        studentName: payment.students.name,
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