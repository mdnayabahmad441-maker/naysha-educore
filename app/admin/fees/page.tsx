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

  // CREATE FEE
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

      const { error: feeError } = await supabase.from("fees").insert([{
        id: feeId,
        student_id: selectedStudent,
        school_id: schoolId,
        total_amount: totalAmount,
        paid_amount: 0,
        status: "pending"
      }])

      if(feeError){
        alert(feeError.message)
        setSaving(false)
        return
      }

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

  // PAY
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

    <div className="p-4 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Fees Dashboard</h1>

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

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl w-full"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedSection}
          onChange={(e)=>setSelectedSection(e.target.value)}
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl w-full"
        >
          <option value="">Select Section</option>
          {sections.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedStudent}
          onChange={(e)=>setSelectedStudent(e.target.value)}
          className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl w-full"
        >
          <option value="">
            Select Student ({students.length})
          </option>
          {students.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

      </div>

      {/* FEE BREAKDOWN */}
      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <h2 className="text-lg font-semibold">Create Fee</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {Object.keys(feeInputs).map(key=>(
            <input
              key={key}
              placeholder={key.toUpperCase()}
              value={(feeInputs as any)[key]}
              onChange={(e)=>setFeeInputs(prev=>({...prev,[key]:e.target.value}))}
              className="p-3 bg-[#0b1220] border border-white/10 rounded-xl"
            />
          ))}

        </div>

        <div className="text-xl font-bold">
          Total: ₹{totalAmount}
        </div>

        <button
          onClick={createFee}
          disabled={saving}
          className="w-full md:w-auto bg-purple-600 px-6 py-3 rounded-xl"
        >
          {saving ? "Saving..." : "Generate Fee"}
        </button>

      </div>

      {/* PAYMENT */}
      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <h2 className="text-lg font-semibold">Collect Payment</h2>

        <div className="flex flex-col md:flex-row gap-4">

          <select
            value={selectedFee}
            onChange={(e)=>setSelectedFee(e.target.value)}
            className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl w-full"
          >
            <option value="">Select Fee</option>
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
            className="bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl w-full"
          />

          <button
            onClick={pay}
            className="bg-blue-600 px-6 py-3 rounded-xl"
          >
            Collect
          </button>

        </div>

      </div>

    </div>
  )
}