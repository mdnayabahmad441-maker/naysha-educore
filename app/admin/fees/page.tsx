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

  const [generating,setGenerating] = useState(false)

  // 📊 SUMMARY
  const totalFees = fees.reduce((s,f)=>s + f.total_amount,0)
  const totalPaid = fees.reduce((s,f)=>s + f.paid_amount,0)
  const totalPending = totalFees - totalPaid

  // 🔥 PAYABLE WITH DISCOUNT
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

    const today = new Date()
    const month = today.getMonth()
    const year = today.getFullYear()

    const { data: allStudents } = await supabase
      .from("students")
      .select("*")
      .eq("school_id", schoolId)

    for (const s of allStudents || []) {

      // ❌ prevent duplicate month fee
      const { data: existing } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id", s.id)
        .gte("created_at", new Date(year, month, 1).toISOString())
        .lte("created_at", new Date(year, month + 1, 0).toISOString())
        .maybeSingle()

      if(existing) continue

      // 📦 get structure
      const { data: structure } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("class_id", s.class_id)
        .single()

      if(!structure) continue

      // 🔥 student_type logic
      let total = 0

      if(s.student_type === "hosteler"){
        total = structure.tuition + structure.hostel
      }
      else if(s.student_type === "day_scholar_transport"){
        total = structure.tuition + structure.transport
      }
      else{
        total = structure.tuition
      }

      total += (structure.misc || 0) + (structure.other || 0)

      const discountDate = new Date(
        year,
        month,
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

  // 💰 PAY
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

    await supabase.from("payments").insert({
      id: crypto.randomUUID(),
      student_id: fee.student_id,
      fee_id: selectedFee,
      amount: Number(payAmount),
      school_id: schoolId,
      receipt_number: "RCPT-"+Date.now(),
      date: new Date()
    })

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

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fees Dashboard</h1>

      {/* GENERATE */}
      <button
        onClick={generateFees}
        className="bg-white/10 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/20"
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

      {/* PAYMENT */}
      <div className="bg-white/10 p-6 rounded-xl flex flex-col md:flex-row gap-4">

        <select value={selectedFee} onChange={(e)=>setSelectedFee(e.target.value)} className="bg-[#0b1220] p-3 rounded-xl w-full">
          <option value="">Select Fee</option>
          {fees.map(f=>(
            <option key={f.id} value={f.id}>
              {f.students?.name} ₹{getPayable(f)}
            </option>
          ))}
        </select>

        <input
          value={payAmount}
          onChange={(e)=>setPayAmount(e.target.value)}
          placeholder="Amount"
          className="bg-[#0b1220] p-3 rounded-xl w-full"
        />

        <button
          onClick={pay}
          className="bg-white/10 border border-white/10 px-6 py-3 rounded-xl hover:bg-white/20"
        >
          Collect
        </button>

      </div>

    </div>
  )
}