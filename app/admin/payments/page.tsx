"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import Button from "@/components/ui/Button"

export default function PaymentsPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [studentSearch,setStudentSearch] = useState("")
  const [studentId,setStudentId] = useState("")
  const [feeId,setFeeId] = useState("")
  const [manualFeeType,setManualFeeType] = useState("")
  const [amount,setAmount] = useState("")

  const [loading,setLoading] = useState(false)

  const manualFeeTypes = [
    "Registration Fee",
    "Admission Fee",
    "Tuition Fee",
    "Hostel Fee",
    "Study Materials",
    "Dress and I card",
    "Caution Money [Refundable]",
    "Library Fee",
    "Test Series Fee",
    "Miscellaneous Fee"
  ]

  // LOAD SCHOOL
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("classes")
        .select("id,name")
        .eq("school_id", schoolId)

      setClasses(data || [])
    }

    load()
  },[schoolId])

  // LOAD STUDENTS FOR SELECTED CLASS
  useEffect(()=>{
    if(!schoolId) return

    if(!selectedClass){
      setStudents([])
      setStudentId("")
      setFeeId("")
      setFees([])
      return
    }

    const load = async ()=>{
      const { data } = await supabase
        .from("students")
        .select("id,name")
        .eq("school_id", schoolId)
        .eq("class_id", selectedClass)

      setStudents(data || [])
      setStudentId("")
      setFeeId("")
      setFees([])
    }

    load()
  },[schoolId, selectedClass])

  // LOAD FEES
  useEffect(()=>{
    if(!studentId || !schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      setFees(data || [])
    }

    load()
  },[studentId,schoolId])

  const filteredStudents = students.filter((student) => {
    if (!studentSearch) return true
    return student.name.toLowerCase().includes(studentSearch.toLowerCase())
  })

  // SAVE PAYMENT
  const save = async ()=>{

    if(!studentId || !amount || (!feeId && !manualFeeType)){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not loaded")
      return
    }

    const payAmount = Number(amount)

    if(isNaN(payAmount) || payAmount <= 0){
      alert("Enter valid amount")
      return
    }

    setLoading(true)

    try{

      let paymentFeeId = feeId
      let totalAmount = 0
      let paidAmount = payAmount

      if (feeId) {
        const fee = fees.find((f) => f.id === feeId)

        if (!fee) {
          alert("Fee not found")
          setLoading(false)
          return
        }

        totalAmount = Number(fee.total_amount || 0)
        const currentPaid = Number(fee.paid_amount || 0)
        paidAmount = currentPaid + payAmount
      }

      if (!paymentFeeId && manualFeeType) {
        const newFeeId = crypto.randomUUID()
        paymentFeeId = newFeeId
        totalAmount = payAmount

        const { error: manualFeeError } = await supabase
          .from("fees")
          .insert({
            id: newFeeId,
            student_id: studentId,
            school_id: schoolId,
            class_id: selectedClass || null,
            month: manualFeeType,
            total_amount: payAmount,
            paid_amount: payAmount,
            status: "paid",
            tuition_fee: 0,
            transport_fee: 0,
            hostel_fee: 0
          })

        if (manualFeeError) {
          alert(manualFeeError.message)
          setLoading(false)
          return
        }
      }

      const paymentId = crypto.randomUUID()

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          id: paymentId,
          student_id: studentId,
          fee_id: paymentFeeId,
          amount: payAmount,
          school_id: schoolId,
          receipt_number: "RCPT-" + Date.now(),
          date: new Date().toISOString()
        })

      if(paymentError){
        alert(paymentError.message)
        setLoading(false)
        return
      }

      if (feeId) {
        const { error: feeError } = await supabase
          .from("fees")
          .update({
            paid_amount: paidAmount,
            status: paidAmount >= totalAmount ? "paid" : "partial"
          })
          .eq("id", feeId)
          .eq("school_id", schoolId)

        if(feeError){
          alert(feeError.message)
          setLoading(false)
          return
        }
      }

      alert("Payment successful ✅")

      // RESET
      setAmount("")
      setFeeId("")
      setManualFeeType("")

      // RELOAD FEES
      const { data } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("school_id", schoolId)

      setFees(data || [])

    }catch(err){
      console.error(err)
      alert("Error processing payment")
    }

    setLoading(false)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Fee Payments
      </h1>

      <div className="bg-white/10 p-6 rounded-xl flex flex-wrap gap-4">

        <select
          value={selectedClass}
          onChange={(e) => {
            setSelectedClass(e.target.value)
            setStudentId("")
            setFeeId("")
            setStudentSearch("")
          }}
          className="bg-[#0b1220] px-4 py-3 rounded-xl"
        >
          <option value="">Select Class</option>
          {classes.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        <input
          value={studentSearch}
          onChange={(e) => setStudentSearch(e.target.value)}
          placeholder="Search student..."
          disabled={!selectedClass}
          className="bg-[#0b1220] px-4 py-3 rounded-xl"
          style={{ minWidth: "220px" }}
        />

        <select
          value={studentId}
          onChange={(e) => {
            setStudentId(e.target.value)
            setFeeId("")
          }}
          disabled={!selectedClass}
          className="bg-[#0b1220] px-4 py-3 rounded-xl"
          style={{ minWidth: "220px" }}
        >
          <option value="">Select Student</option>
          {filteredStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={feeId}
          onChange={(e) => {
            setFeeId(e.target.value)
            if (e.target.value) {
              setManualFeeType("")
            }
          }}
          disabled={!studentId}
          className="bg-[#0b1220] px-4 py-3 rounded-xl"
          style={{ minWidth: "220px" }}
        >
          <option value="">Select Existing Fee</option>
          {fees.map((f) => (
            <option key={f.id} value={f.id}>
              ₹{f.total_amount} ({f.status})
            </option>
          ))}
        </select>

        <div className="flex-1 min-w-55">
          <select
            value={manualFeeType}
            onChange={(e) => {
              setManualFeeType(e.target.value)
              if (e.target.value) {
                setFeeId("")
              }
            }}
            disabled={!studentId}
            className="bg-[#0b1220] px-4 py-3 rounded-xl w-full"
          >
            <option value="">Manual Fee Type</option>
            {manualFeeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <input
          value={amount}
          onChange={(e)=>setAmount(e.target.value)}
          placeholder="Enter Amount"
          className="bg-[#0b1220] px-4 py-3 rounded-xl"
          style={{ minWidth: "220px" }}
        />

        <Button color="green" onClick={save} disabled={loading}>
          {loading ? "Processing..." : "Pay"}
        </Button>

      </div>

    </div>
  )
}