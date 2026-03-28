"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
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

  const [lastPayment,setLastPayment] = useState<any>(null)
  const [selectedFeeObj,setSelectedFeeObj] = useState<any>(null)
  const [selectedStudentObj,setSelectedStudentObj] = useState<any>(null)

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD DATA
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

  const loadPayments = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("payments")
      .select("*")
      .eq("school_id", schoolId)

    setPayments(data || [])
  }

  // CALCULATIONS
  const totalFees = fees.reduce((s,f)=>s + (f.total_amount || 0),0)
  const totalPaid = payments.reduce((s,p)=>s + (p.amount || 0),0)
  const totalPending = totalFees - totalPaid

  const filteredFees = fees.filter(f=>f.student_id === selectedStudent)

  // GENERATE FEES
  const generateFees = async ()=>{
    if(!schoolId){
      alert("School not loaded")
      return
    }

    setGenerating(true)

    const { data: allStudents } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)

    for (const s of allStudents || []) {

      const { data: existing } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id", s.id)
        .maybeSingle()

      if(existing) continue

      await supabase.from("fees").insert({
        student_id: s.id,
        school_id: schoolId,
        total_amount: 1000,
        paid_amount: 0,
        status: "pending"
      })
    }

    alert("Fees Generated ✅")
    loadFees()
    setGenerating(false)
  }

  // PDF + UPLOAD
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

    const { error } = await supabase.storage
      .from("receipts")
      .upload(fileName, blob, {
        contentType: "application/pdf"
      })

    if(error){
      alert("Upload failed")
      return null
    }

    const { data } = supabase
      .storage
      .from("receipts")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // PAYMENT
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

  // UI
  return(
    <div className="p-4 md:p-8 min-h-screen bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#020617] text-white">

      <h1 className="text-2xl md:text-3xl font-bold mb-6">Fees Dashboard</h1>

      <div className="flex flex-wrap gap-3 mb-6">

        <button
          onClick={()=>router.push("/admin/fees/receipts")}
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 shadow-lg hover:scale-105 transition"
        >
          Receipt History
        </button>

        <button
          onClick={generateFees}
          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg hover:scale-105 transition"
        >
          {generating ? "Generating..." : "Generate Fees"}
        </button>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-8">

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl">
          <p className="text-gray-400">Total Fees</p>
          <h2 className="text-xl font-semibold mt-2">₹{totalFees}</h2>
        </div>

        <div className="backdrop-blur-xl bg-green-500/10 border border-green-400/20 p-6 rounded-2xl">
          <p className="text-gray-400">Collected</p>
          <h2 className="text-green-400 text-xl mt-2">₹{totalPaid}</h2>
        </div>

        <div className="backdrop-blur-xl bg-yellow-500/10 border border-yellow-400/20 p-6 rounded-2xl">
          <p className="text-gray-400">Pending</p>
          <h2 className="text-yellow-400 text-xl mt-2">₹{totalPending}</h2>
        </div>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <select onChange={(e)=>setSelectedClass(e.target.value)} className="bg-white/5 p-3 rounded-xl">
          <option>Class</option>
          {classes.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        <select onChange={(e)=>setSelectedSection(e.target.value)} className="bg-white/5 p-3 rounded-xl">
          <option>Section</option>
          {sections.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        <select onChange={(e)=>setSelectedStudent(e.target.value)} className="bg-white/5 p-3 rounded-xl">
          <option>Student</option>
          {students.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        <select onChange={(e)=>setSelectedFee(e.target.value)} className="bg-white/5 p-3 rounded-xl">
          <option>Select Fee</option>
          {filteredFees.map(f=>(
            <option key={f.id} value={f.id}>
              {f.students?.name} ₹{f.total_amount}
            </option>
          ))}
        </select>

      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">

        <input
          value={payAmount}
          onChange={(e)=>setPayAmount(e.target.value)}
          placeholder="Enter amount"
          className="bg-white/5 p-3 rounded-xl w-full sm:w-48"
        />

        <button
          onClick={pay}
          className="px-6 py-2 rounded-xl bg-green-600 hover:bg-green-700 transition"
        >
          Collect
        </button>

      </div>

      {lastPayment && selectedStudentObj && (
        <div ref={receiptRef} className="p-6 rounded-2xl bg-white/5 border border-white/10">
          <h2 className="text-green-400 mb-2">Receipt</h2>
          <p>{selectedStudentObj.name}</p>
          <p>₹{lastPayment.amount}</p>
        </div>
      )}

    </div>
  )
}