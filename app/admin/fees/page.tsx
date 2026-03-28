"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
import { getSettings } from "@/lib/settings"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRouter } from "next/navigation"

export default function FeesPage(){

  const router = useRouter()
  const receiptRef = useRef<HTMLDivElement>(null)

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [fees,setFees] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedStudent,setSelectedStudent] = useState("")

  const [selectedFee,setSelectedFee] = useState("")
  const [payAmount,setPayAmount] = useState("")

  const [generating,setGenerating] = useState(false)

  const [selectedMonth,setSelectedMonth] = useState("") // ✅ ADDED

  const [lastPayment,setLastPayment] = useState<any>(null)
  const [selectedFeeObj,setSelectedFeeObj] = useState<any>(null)
  const [selectedStudentObj,setSelectedStudentObj] = useState<any>(null)

  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))

    loadFees()
    loadPayments()

  },[schoolId])

  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))
  },[selectedClass])

  useEffect(()=>{
    if(!selectedClass || !selectedSection) return

    supabase.from("students")
      .select("*")
      .eq("class_id",selectedClass)
      .eq("section_id",selectedSection)
      .then(({data})=>setStudents(data || []))
  },[selectedClass,selectedSection])

  const loadFees = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("fees")
      .select(`*, students(name, phone, roll_number)`)
      .eq("school_id", schoolId)

    setFees(data || [])
  }

  // ✅ FIXED STUDENT JOIN
  const loadPayments = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("payments")
      .select(`
        *,
        students(name, phone, roll_number)
      `)
      .eq("school_id", schoolId)

    setPayments(data || [])
  }

  const totalFees = fees.reduce((s,f)=>s + (f.total_amount || 0),0)
  const totalPaid = payments.reduce((s,p)=>s + (p.amount || 0),0)
  const totalPending = totalFees - totalPaid

  const filteredFees = fees.filter(f=>f.student_id === selectedStudent)

  // ✅ UPDATED WITH MONTH (NO LOGIC REMOVED)
  const generateFees = async ()=>{
    if(!schoolId){
      alert("School not loaded")
      return
    }

    if(!selectedMonth){
      alert("Select month")
      return
    }

    setGenerating(true)

    const feeSettings = await getSettings("fees")

    const tuition = Number(feeSettings?.tuition_fee || 0)
    const transport = Number(feeSettings?.transport_fee || 0)
    const hostel = Number(feeSettings?.hostel_fee || 0)

    const totalAmount = tuition + transport + hostel

    const { data: allStudents } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)

    for (const s of allStudents || []) {

      // ✅ PREVENT DUPLICATE PER MONTH
      const { data: existing } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id", s.id)
        .eq("month", selectedMonth)
        .maybeSingle()

      if(existing) continue

      await supabase.from("fees").insert({
        student_id: s.id,
        school_id: schoolId,
        total_amount: totalAmount,
        paid_amount: 0,
        status: "pending",
        tuition_fee: tuition,
        transport_fee: transport,
        hostel_fee: hostel,
        month: selectedMonth // ✅ ADDED
      })
    }

    alert("Fees Generated ✅")
    loadFees()
    setGenerating(false)
  }

  const generateAndUploadPDF = async ()=>{
    if(!receiptRef.current || !schoolId) return null

    const canvas = await html2canvas(receiptRef.current,{
      backgroundColor:"#0b1220"
    })

    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    pdf.addImage(img,"PNG",0,0,210,297)

    const blob = pdf.output("blob")

    const fileName = `receipt-${Date.now()}.pdf`

    await supabase.storage
      .from("receipts")
      .upload(fileName, blob, {
        contentType: "application/pdf"
      })

    const { data } = supabase
      .storage
      .from("receipts")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  const pay = async ()=>{

    if(!schoolId){
      alert("School not loaded")
      return
    }

    if(!selectedFee || !payAmount){
      alert("Fill all fields")
      return
    }

    const fee = fees.find(f=>f.id === selectedFee)
    const student = students.find(s=>s.id === selectedStudent)

    if(!fee || !student){
      alert("Data error")
      return
    }

    const amount = Number(payAmount)

    const { data: paymentData, error } = await supabase
      .from("payments")
      .insert({
        student_id: fee.student_id,
        fee_id: fee.id,
        amount,
        school_id: schoolId,
        date: new Date().toISOString()
      })
      .select()
      .single()

    if(error){
      alert(error.message)
      return
    }

    const newPaid = (fee.paid_amount || 0) + amount

    await supabase
      .from("fees")
      .update({
        paid_amount: newPaid,
        status: newPaid >= fee.total_amount ? "paid" : "pending"
      })
      .eq("id", fee.id)

    await sendNotification({
      school_id: schoolId,
      student_id: fee.student_id,
      title: "Payment Received",
      message: `₹${payAmount} received`,
      type: "fee"
    })

    setLastPayment(paymentData)
    setSelectedFeeObj(fee)
    setSelectedStudentObj(student)

    setTimeout(async ()=>{
      const pdfUrl = await generateAndUploadPDF()

      if(student.phone && pdfUrl){
        await fetch("/api/send-whatsapp",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: student.phone,
            studentName: student.name,
            pdfUrl
          })
        })
      }
    },500)

    alert("Payment Complete ✅")

    setPayAmount("")
    loadFees()
    loadPayments()
  }

  const selectStyle = "w-full bg-[#0f172a] text-white border border-white/10 p-3 rounded-xl"

  return(
    <div className="p-6 min-h-screen bg-[#020617] text-white">

      <h1 className="text-2xl font-bold mb-6">Fees Dashboard</h1>

      <div className="flex gap-3 mb-6">

        <button
          onClick={()=>router.push("/admin/fees/receipts")}
          className="px-4 py-2 rounded-xl bg-purple-600"
        >
          Receipt History
        </button>

        {/* ✅ MONTH SELECT (ADDED ONLY) */}
        <select
          value={selectedMonth}
          onChange={(e)=>setSelectedMonth(e.target.value)}
          className={selectStyle}
        >
          <option value="">Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
          <option>May</option>
          <option>June</option>
          <option>July</option>
          <option>August</option>
          <option>September</option>
          <option>October</option>
          <option>November</option>
          <option>December</option>
        </select>

        <button
          onClick={generateFees}
          className="px-4 py-2 rounded-xl bg-blue-600"
        >
          {generating ? "Generating..." : "Generate Fees"}
        </button>

      </div>

      {/* REST OF YOUR UI UNTOUCHED */}

    </div>
  )
}