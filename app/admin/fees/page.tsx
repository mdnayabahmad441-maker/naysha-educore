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

  const [schoolId,setSchoolId] = useState<any>(null)

  // 🔥 EXISTING STATES
  const [fees,setFees] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])

  const [selectedFee,setSelectedFee] = useState("")
  const [payAmount,setPayAmount] = useState("")

  const [selectedMonth,setSelectedMonth] = useState("")
  const [generating,setGenerating] = useState(false)

  // 🔥 NEW STATES (ONLY ADDED — NOTHING REMOVED)
  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedStudent,setSelectedStudent] = useState("")

  // ================= INIT =================
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  useEffect(()=>{
    if(!schoolId) return

    loadFees()
    loadPayments()

    // 🔥 LOAD CLASSES
    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))

  },[schoolId])

  // 🔥 LOAD SECTIONS
  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))

  },[selectedClass])

  // 🔥 LOAD STUDENTS
  useEffect(()=>{
    if(!selectedClass || !selectedSection) return

    supabase.from("students")
      .select("*")
      .eq("class_id",selectedClass)
      .eq("section_id",selectedSection)
      .then(({data})=>setStudents(data || []))

  },[selectedClass,selectedSection])

  // ================= LOAD =================
  const loadFees = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("fees")
      .select(`*, students(name, phone)`)
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

  // ================= GENERATE =================
  const generateFees = async ()=>{

    if(!selectedMonth){
      alert("Select month")
      return
    }

    setGenerating(true)

    const settings = await getSettings("fees")

    const tuition = Number(settings?.tuition_fee || 0)
    const transport = Number(settings?.transport_fee || 0)
    const hostel = Number(settings?.hostel_fee || 0)

    const { data: allStudents } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)

    for(const s of allStudents || []){

      await supabase.from("fees").insert({
        student_id: s.id,
        school_id: schoolId,
        total_amount: tuition + transport + hostel,
        paid_amount: 0,
        status: "pending",
        month: selectedMonth,
        tuition_fee: tuition,
        transport_fee: transport,
        hostel_fee: hostel
      })
    }

    alert("Fees Generated ✅")
    loadFees()
    setGenerating(false)
  }

  // ================= MANUAL =================
  const createManualFee = async ()=>{

    if(!selectedStudent || !selectedMonth){
      alert("Select student & month")
      return
    }

    await supabase.from("fees").insert({
      student_id: selectedStudent,
      school_id: schoolId,
      total_amount: 0,
      paid_amount: 0,
      status: "pending",
      month: selectedMonth
    })

    alert("Manual Fee Created ✅")
    loadFees()
  }

  // ================= PAYMENT =================
  const pay = async ()=>{

    if(!selectedFee || !payAmount){
      alert("Fill all fields")
      return
    }

    const fee = fees.find(f=>f.id === selectedFee)
    if(!fee) return

    const amount = Number(payAmount)

    await supabase.from("payments").insert({
      student_id: fee.student_id,
      fee_id: fee.id,
      amount,
      school_id: schoolId,
      date: new Date().toISOString()
    })

    const newPaid = (fee.paid_amount || 0) + amount

    await supabase.from("fees")
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

    alert("Payment Complete ✅")

    setPayAmount("")
    loadFees()
    loadPayments()
  }

  const selectStyle = "w-full bg-[#0f172a] text-white border border-white/10 p-3 rounded-xl"

  return(
    <div className="p-6 min-h-screen bg-[#020617] text-white">

      <h1 className="text-2xl font-bold mb-6">Fees Dashboard</h1>

      {/* ACTIONS */}
      <div className="flex gap-3 mb-6 flex-wrap">

        <button
          onClick={()=>router.push("/admin/fees/receipts")}
          className="px-4 py-2 rounded-xl bg-purple-600"
        >
          Receipt History
        </button>

        <select
          value={selectedMonth}
          onChange={(e)=>setSelectedMonth(e.target.value)}
          className={selectStyle}
        >
          <option value="">Select Month</option>
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

      {/* 🔥 CLASS → SECTION → STUDENT */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">

        <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className={selectStyle}>
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={selectedSection} onChange={(e)=>setSelectedSection(e.target.value)} className={selectStyle}>
          <option value="">Select Section</option>
          {sections.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)} className={selectStyle}>
          <option value="">Select Student</option>
          {students.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

      </div>

      {/* MANUAL */}
      <button
        onClick={createManualFee}
        className="mb-6 px-4 py-2 bg-purple-500 rounded-xl"
      >
        Create Manual Fee
      </button>

    </div>
  )
}