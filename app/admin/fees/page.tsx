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

  const [saving,setSaving] = useState(false) // 🔥 NEW

  // 🔥 FEE BREAKDOWN
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

  // 📊 SUMMARY
  const totalFees = fees.reduce((s,f)=>s + f.total_amount,0)
  const totalPaid = fees.reduce((s,f)=>s + f.paid_amount,0)
  const totalPending = totalFees - totalPaid

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

  // ➕ CREATE FEE (🔥 FIXED)
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

      // ✅ CREATE MAIN FEE
      const { error: feeError } = await supabase.from("fees").insert([{
        id: feeId,
        student_id: selectedStudent,
        school_id: schoolId,
        total_amount: totalAmount,
        paid_amount: 0,
        status: "pending"
      }])

      if(feeError){
        console.error("FEE ERROR:", feeError)
        alert(feeError.message)
        setSaving(false)
        return
      }

      // ✅ CREATE BREAKDOWN (FIXED)
      const items = Object.entries(feeInputs)
        .filter(([_,v]) => v !== "" && Number(v) > 0)
        .map(([type,amount])=>({
          id: crypto.randomUUID(), // 🔥 IMPORTANT FIX
          fee_id: feeId,
          type,
          amount: Number(amount)
        }))

      if(items.length > 0){

        const { error: itemError } = await supabase
          .from("fee_items")
          .insert(items)

        if(itemError){
          console.error("ITEM ERROR:", itemError)
          alert(itemError.message)
        }
      }

      // RESET
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

  // 💰 PAY (UNCHANGED)
  const pay = async ()=>{

    if(!selectedFee || !payAmount) return

    const fee = fees.find(f=>f.id === selectedFee)
    if(!fee) return

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

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fees Dashboard</h1>

      {/* SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white/10 p-6 rounded-xl">
          <p>Total Fees</p>
          <h2>₹{totalFees}</h2>
        </div>
        <div className="bg-white/10 p-6 rounded-xl">
          <p>Collected</p>
          <h2 className="text-green-400">₹{totalPaid}</h2>
        </div>
        <div className="bg-white/10 p-6 rounded-xl">
          <p>Pending</p>
          <h2 className="text-yellow-400">₹{totalPending}</h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white/10 p-6 rounded-xl flex gap-4 flex-wrap">

        <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)}>
          <option>Select Class</option>
          {classes.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        <select value={selectedSection} onChange={(e)=>setSelectedSection(e.target.value)}>
          <option>Select Section</option>
          {sections.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        <select value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)}>
          <option>Select Student</option>
          {students.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

      </div>

      {/* FEE BREAKDOWN */}
      <div className="bg-white/10 p-6 rounded-xl grid md:grid-cols-2 gap-4">

        {Object.keys(feeInputs).map(key=>(
          <input
            key={key}
            placeholder={key.toUpperCase()}
            value={(feeInputs as any)[key]}
            onChange={(e)=>setFeeInputs(prev=>({...prev,[key]:e.target.value}))}
            className="p-3 bg-[#0b1220] rounded"
          />
        ))}

        <div className="col-span-2 text-xl font-bold">
          Total: ₹{totalAmount}
        </div>

        <button
          onClick={createFee}
          disabled={saving}
          className="bg-purple-600 p-3 rounded"
        >
          {saving ? "Saving..." : "Generate Fee"}
        </button>

      </div>

      {/* PAYMENT */}
      <div className="bg-white/10 p-6 rounded-xl flex gap-4 flex-wrap">

        <select value={selectedFee} onChange={(e)=>setSelectedFee(e.target.value)}>
          <option>Select Fee</option>
          {fees
            .filter(f=>!selectedStudent || f.student_id === selectedStudent)
            .map(f=>(
            <option key={f.id} value={f.id}>
              {f.students?.name} ₹{f.total_amount}
            </option>
          ))}
        </select>

        <input
          placeholder="Pay Amount"
          value={payAmount}
          onChange={(e)=>setPayAmount(e.target.value)}
        />

        <button onClick={pay} className="bg-blue-600 p-3 rounded">
          Collect Payment
        </button>

      </div>

    </div>
  )
}