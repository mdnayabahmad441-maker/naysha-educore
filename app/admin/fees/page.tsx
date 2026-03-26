"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function FeesPage(){

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

  const [saving,setSaving] = useState(false)
  const [generating,setGenerating] = useState(false) // 🔥 NEW

  const [feeInputs,setFeeInputs] = useState({
    tuition: "",
    transport: "",
    hostel: "",
    misc: "",
    other: ""
  })

  const totalAmount =
    Number(feeInputs.tuition || 0) +
    Number(feeInputs.transport || 0) +
    Number(feeInputs.hostel || 0) +
    Number(feeInputs.misc || 0) +
    Number(feeInputs.other || 0)

  const totalFees = fees.reduce((s,f)=>s + f.total_amount,0)
  const totalPaid = fees.reduce((s,f)=>s + f.paid_amount,0)
  const totalPending = totalFees - totalPaid

  // 🔥 PAYABLE CALCULATION
  const getPayable = (fee:any)=>{
    const today = new Date()
    const discountDate = new Date(fee.discount_last_date)

    if(fee.discount_amount && today <= discountDate){
      return fee.total_amount - fee.discount_amount
    }

    return fee.total_amount
  }

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // LOAD SECTIONS
  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))
  },[selectedClass])

  // LOAD STUDENTS
  useEffect(()=>{
    if(!selectedClass || !selectedSection) return

    supabase.from("students")
      .select("*")
      .eq("class_id",selectedClass)
      .eq("section_id",selectedSection)
      .then(({data})=>setStudents(data || []))
  },[selectedClass,selectedSection])

  // LOAD FEES
  const loadFees = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("fees")
      .select(`*, students(name)`)
      .eq("school_id", schoolId)

    setFees(data || [])
  }

  // LOAD PAYMENTS
  const loadPayments = async ()=>{
    if(!schoolId) return

    const { data } = await supabase
      .from("payments")
      .select(`*, students(name)`)
      .eq("school_id", schoolId)
      .order("date",{ascending:false})

    setPayments(data || [])
  }

  useEffect(()=>{
    loadFees()
    loadPayments()
  },[schoolId])

  // 🔥 AUTO GENERATE FEES
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

      const { data: structure } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("class_id", s.class_id)
        .single()

      if(!structure) continue

      const total =
        structure.tuition +
        structure.transport +
        structure.hostel +
        structure.misc +
        structure.other

      const today = new Date()

      const discountDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        structure.discount_last_date
      )

      await supabase.from("fees").insert({
        id: crypto.randomUUID(),
        student_id: s.id,
        school_id: schoolId,
        total_amount: total,
        paid_amount: 0,
        status: "pending",
        discount_amount: structure.discount_amount,
        discount_last_date: discountDate,
        due_date: discountDate
      })
    }

    alert("Monthly fees generated ✅")
    loadFees()
    setGenerating(false)
  }

  // CREATE FEE (MANUAL)
  const createFee = async ()=>{

    if(saving) return

    if(!schoolId){
      alert("School not loaded")
      return
    }

    if(!selectedStudent){
      alert("Select student")
      return
    }

    if(totalAmount <= 0){
      alert("Enter valid fee amount")
      return
    }

    setSaving(true)

    try{

      const feeId = crypto.randomUUID()

      await supabase.from("fees").insert([{
        id: feeId,
        student_id: selectedStudent,
        school_id: schoolId,
        total_amount: totalAmount,
        paid_amount: 0,
        status: "pending"
      }])

      const items = Object.entries(feeInputs)
        .filter(([_,v]) => v !== "" && Number(v) > 0)
        .map(([type,amount])=>({
          id: crypto.randomUUID(),
          fee_id: feeId,
          type,
          amount: Number(amount)
        }))

      if(items.length > 0){
        await supabase.from("fee_items").insert(items)
      }

      setFeeInputs({
        tuition:"",
        transport:"",
        hostel:"",
        misc:"",
        other:""
      })

      loadFees()

    }catch(err){
      console.error(err)
    }

    setSaving(false)
  }

  // 💰 PAY (UPDATED WITH DISCOUNT LOGIC)
  const pay = async ()=>{

    if(!selectedFee || !payAmount) return

    const fee = fees.find(f=>f.id === selectedFee)
    if(!fee) return

    const payable = getPayable(fee)

    if(Number(payAmount) > payable){
      alert("Amount exceeds payable")
      return
    }

    const newPaid = fee.paid_amount + Number(payAmount)

    await supabase.from("payments").insert([{
      id: crypto.randomUUID(),
      student_id: fee.student_id,
      fee_id: selectedFee,
      amount: Number(payAmount),
      school_id: schoolId,
      receipt_number: "RCPT-"+Date.now(),
      date: new Date()
    }])

    await supabase
      .from("fees")
      .update({
        paid_amount: newPaid,
        status: newPaid >= fee.total_amount ? "paid" : "pending"
      })
      .eq("id", selectedFee)

    setPayAmount("")
    loadFees()
    loadPayments()
  }

  return(

    <div className="p-4 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fees Dashboard</h1>

      {/* 🔥 AUTO BUTTON */}
      <button
        onClick={generateFees}
        className="bg-purple-700 px-6 py-3 rounded-xl"
      >
        {generating ? "Generating..." : "Generate Monthly Fees"}
      </button>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-sm text-gray-400">Total Fees</p>
          <h2 className="text-xl font-bold mt-2">₹{totalFees}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-sm text-gray-400">Collected</p>
          <h2 className="text-xl font-bold mt-2 text-green-400">₹{totalPaid}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl">
          <p className="text-sm text-gray-400">Pending</p>
          <h2 className="text-xl font-bold mt-2 text-yellow-400">₹{totalPending}</h2>
        </div>

      </div>

      {/* FILTER */}
      <div className="bg-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-4">

        <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="bg-[#0b1220] p-3 rounded-xl w-full">
          <option value="">Select Class</option>
          {classes.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        <select value={selectedSection} onChange={(e)=>setSelectedSection(e.target.value)} className="bg-[#0b1220] p-3 rounded-xl w-full">
          <option value="">Select Section</option>
          {sections.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        <select value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)} className="bg-[#0b1220] p-3 rounded-xl w-full">
          <option value="">Select Student ({students.length})</option>
          {students.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

      </div>

    </div>
  )
}