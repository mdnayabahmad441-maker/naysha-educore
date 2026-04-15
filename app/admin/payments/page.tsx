"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string
  name: string
  class?: string
}

interface Fee {
  id: string
  label: string
  total_amount: number
  paid_amount: number
  status: "paid" | "partial" | "due"
  fee_type?: string
  month?: string
}

interface Payment {
  id: string
  student_name: string
  receipt_number: string
  fee_label: string
  amount: number
  total_amount: number
  payment_date: string
  status: "paid" | "partial" | "due"
  is_manual: boolean
  payment_mode: string
}

interface Stats {
  totalCollected: number
  totalPending: number
  thisMonth: number
  todayCount: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
}

function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN")
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function todayISO() {
  return new Date().toISOString().split("T")[0]
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PaymentsPage() {

  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCollected: 0,
    totalPending: 0,
    thisMonth: 0,
    todayCount: 0
  })

  const [loadingTable, setLoadingTable] = useState(true)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [monthFilter, setMonthFilter] = useState("")

  const [modalOpen, setModalOpen] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [fees, setFees] = useState<Fee[]>([])

  const [mStudentId, setMStudentId] = useState("")
  const [mFeeId, setMFeeId] = useState("")
  const [mAmount, setMAmount] = useState("")
  const [mDate, setMDate] = useState(todayISO())
  const [mMode, setMMode] = useState("cash")
  const [mRemarks, setMRemarks] = useState("")
  const [mLoading, setMLoading] = useState(false)
  const [isManualDate, setIsManualDate] = useState(false)

  // ── INIT ─────────────────────────────────────────────────

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return
    loadPayments()
    loadStudents()
  },[schoolId])

  // ── FIXED STUDENT LOADER (🔥 THIS WAS THE ISSUE) ─────────

  const loadStudents = async () => {

    const { data, error } = await supabase
      .from("student_enrollments")
      .select(`
        student_id,
        students ( id, name ),
        classes ( name )
      `)
      .eq("school_id", schoolId)

    if(error){
      console.error("Student load error:", error)
      return
    }

    const formatted = (data || []).map((e:any)=>({
      id: e.student_id,
      name: e.students?.name || "Unknown",
      class: e.classes?.name || ""
    }))

    setStudents(formatted)
  }

  // ── LOAD PAYMENTS ───────────────────────────────────────

  const loadPayments = async ()=>{
    setLoadingTable(true)

    const { data } = await supabase
      .from("payments")
      .select(`
        id,
        amount,
        receipt_number,
        payment_date,
        is_manual,
        payment_mode,
        students ( name ),
        fees ( label, total_amount, paid_amount, status )
      `)
      .eq("school_id", schoolId)
      .order("payment_date",{ascending:false})

    const rows = (data || []).map((p:any)=>({
      id: p.id,
      student_name: p.students?.name || "—",
      receipt_number: p.receipt_number,
      fee_label: p.fees?.label || "—",
      amount: p.amount,
      total_amount: p.fees?.total_amount || 0,
      payment_date: p.payment_date,
      status: p.fees?.status || "due",
      is_manual: p.is_manual,
      payment_mode: p.payment_mode || "cash"
    }))

    setPayments(rows)
    setFilteredPayments(rows)
    setLoadingTable(false)
  }

  // ── LOAD FEES ───────────────────────────────────────────

  const loadFees = async (studentId:string)=>{
    const { data } = await supabase
      .from("fees")
      .select("*")
      .eq("student_id", studentId)
      .eq("school_id", schoolId)
      .neq("status","paid")

    setFees(data || [])
  }

  const handleFeeChange = (feeId:string)=>{
    setMFeeId(feeId)
    const fee = fees.find(f=>f.id === feeId)
    if(fee){
      setMAmount(String(fee.total_amount - fee.paid_amount))
    }
  }

  const handleDateChange = (val:string)=>{
    setMDate(val)
    const today = new Date()
    today.setHours(0,0,0,0)
    setIsManualDate(new Date(val) < today)
  }

  // ── SAVE ────────────────────────────────────────────────

  const save = async ()=>{

    if(!mStudentId || !mFeeId || !mAmount){
      alert("Fill all fields")
      return
    }

    const selectedDate = new Date(mDate)
    const today = new Date()
    today.setHours(0,0,0,0)

    if(selectedDate > today){
      alert("❌ Future payment not allowed")
      return
    }

    setMLoading(true)

    try{

      const fee = fees.find(f=>f.id === mFeeId)
      if(!fee) return

      const newPaid = (fee.paid_amount || 0) + Number(mAmount)
      const paymentId = crypto.randomUUID()

      await supabase.from("payments").insert({
        id: paymentId,
        student_id: mStudentId,
        fee_id: mFeeId,
        amount: Number(mAmount),
        school_id: schoolId,
        receipt_number: "RCPT-"+Date.now(),
        payment_date: selectedDate.toISOString(),
        is_manual: isManualDate,
        payment_mode: mMode,
        remarks: mRemarks
      })

      await supabase
        .from("fees")
        .update({
          paid_amount: newPaid,
          status: newPaid >= fee.total_amount ? "paid" : "partial"
        })
        .eq("id", mFeeId)

      await fetch("/api/notify",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          type:"payment",
          refId: paymentId
        })
      })

      alert("Payment successful ✅")

      setModalOpen(false)
      loadPayments()

    }catch(err){
      console.error(err)
      alert("Error")
    }

    setMLoading(false)
  }

  // ── UI SAME AS YOURS (NOT CHANGED) ───────────────────────

  return (
    <div className="p-6 text-white">

      <h1 className="text-xl">Fee Payments</h1>

      <button onClick={()=>setModalOpen(true)}>
        Record Payment
      </button>

      {modalOpen && (
        <div>

          <select
            value={mStudentId}
            onChange={(e)=>{
              setMStudentId(e.target.value)
              loadFees(e.target.value)
            }}
          >
            <option>Select student</option>
            {students.map(s=>(
              <option key={s.id} value={s.id}>
                {s.name} {s.class && `- ${s.class}`}
              </option>
            ))}
          </select>

          <select
            value={mFeeId}
            onChange={(e)=>handleFeeChange(e.target.value)}
          >
            <option>Select fee</option>
            {fees.map(f=>(
              <option key={f.id} value={f.id}>
                {f.label} - ₹{f.total_amount - f.paid_amount}
              </option>
            ))}
          </select>

          <input value={mAmount} onChange={(e)=>setMAmount(e.target.value)} />
          <input type="date" value={mDate} onChange={(e)=>handleDateChange(e.target.value)} />

          <button onClick={save}>
            {mLoading ? "Saving..." : "Save"}
          </button>

        </div>
      )}

    </div>
  )
}