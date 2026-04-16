"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

// ─── TYPES ─────────────────

interface Student {
  id: string
  name: string
  class: string
}

interface Payment {
  id: string
  student_name: string
  amount: number
  receipt_number: string
  fee_type: string
  payment_date: string
  payment_mode: string
}

const FEE_KEYS = ["hostel","school","transport","misc","others"]

export default function Page() {

  const [schoolId,setSchoolId]=useState<string|null>(null)

  const [students,setStudents]=useState<Student[]>([])
  const [filteredStudents,setFilteredStudents]=useState<Student[]>([])
  const [payments,setPayments]=useState<Payment[]>([])

  const [selectedClass,setSelectedClass]=useState("")
  const [search,setSearch]=useState("")
  const [selectedStudent,setSelectedStudent]=useState<Student|null>(null)

  const [modalOpen,setModalOpen]=useState(false)

  const [feeAmounts,setFeeAmounts]=useState<Record<string,string>>({})
  const [total,setTotal]=useState(0)

  const [date,setDate]=useState("")
  const [mode,setMode]=useState("cash")

  const [stats,setStats]=useState({
    total:0,
    month:0,
    today:0
  })

  // ─── INIT ─────────────────

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return
    loadStudents()
    loadPayments()
  },[schoolId])

  // ─── LOAD STUDENTS (SAFE) ─────────

  const loadStudents = async () => {

    const { data, error } = await supabase
      .from("students")
      .select("id,name,class")
      .eq("school_id",schoolId)

    if(error){
      console.error(error)
      alert("Students not loading")
      return
    }

    setStudents(data || [])
    setFilteredStudents(data || [])
  }

  // ─── LOAD PAYMENTS ─────────

  const loadPayments = async () => {

    const { data } = await supabase
      .from("payments")
      .select(`
        id,amount,receipt_number,fee_type,payment_date,payment_mode,
        students(name)
      `)
      .eq("school_id",schoolId)
      .order("payment_date",{ascending:false})

    const rows = (data||[]).map((p:any)=>({
      id:p.id,
      student_name:p.students?.name || "—",
      amount:p.amount,
      receipt_number:p.receipt_number,
      fee_type:p.fee_type,
      payment_date:p.payment_date,
      payment_mode:p.payment_mode
    }))

    setPayments(rows)

    // stats
    const total = rows.reduce((s,r)=>s+r.amount,0)
    const todayStr = new Date().toISOString().split("T")[0]

    const today = rows.filter(r=>r.payment_date?.startsWith(todayStr)).length

    const month = rows
      .filter(r=>{
        const d=new Date(r.payment_date)
        const now=new Date()
        return d.getMonth()===now.getMonth()
      })
      .reduce((s,r)=>s+r.amount,0)

    setStats({total,month,today})
  }

  // ─── FILTER STUDENTS ───────

  useEffect(()=>{
    let result = students

    if(selectedClass){
      result = result.filter(s=>s.class===selectedClass)
    }

    if(search){
      result = result.filter(s=>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredStudents(result)

  },[selectedClass,search,students])

  // ─── TOTAL ────────────────

  useEffect(()=>{
    let sum=0
    FEE_KEYS.forEach(k=>sum+=Number(feeAmounts[k]||0))
    setTotal(sum)
  },[feeAmounts])

  // ─── SAVE ─────────────────

  const save = async () => {

    if(!selectedStudent){
      alert("Select student")
      return
    }

    if(total<=0){
      alert("Enter amount")
      return
    }

    const inserts = FEE_KEYS
      .filter(k=>Number(feeAmounts[k])>0)
      .map(k=>({
        id:crypto.randomUUID(),
        student_id:selectedStudent.id,
        fee_type:k,
        amount:Number(feeAmounts[k]),
        school_id:schoolId,
        receipt_number:"RCPT-"+Date.now()+"-"+k,
        payment_date:new Date(date || new Date()).toISOString(),
        payment_mode:mode
      }))

    const { error } = await supabase.from("payments").insert(inserts)

    if(error){
      alert(error.message)
      return
    }

    setModalOpen(false)
    setFeeAmounts({})
    setSelectedStudent(null)

    await loadPayments()

    alert("Payment saved successfully")
  }

  // ─── UI ───────────────────

  return (
    <>
      <style>{css}</style>

      <div className="page">

        {/* HEADER */}
        <div className="top">
          <div>
            <h2>Fee Management</h2>
            <p>Manage and record payments</p>
          </div>
          <button className="btn" onClick={()=>setModalOpen(true)}>
            + Record Payment
          </button>
        </div>

        {/* STATS */}
        <div className="grid">
          <div className="card"><small>Total</small><h3>₹{stats.total}</h3></div>
          <div className="card"><small>This Month</small><h3 style={{color:"#4ade80"}}>₹{stats.month}</h3></div>
          <div className="card"><small>Today</small><h3>{stats.today}</h3></div>
        </div>

        {/* TABLE */}
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Receipt</th>
                <th>Fee</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p=>(
                <tr key={p.id}>
                  <td>{p.student_name}</td>
                  <td>{p.receipt_number}</td>
                  <td>{p.fee_type}</td>
                  <td>₹{p.amount}</td>
                  <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                  <td>{p.payment_mode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="overlay" onClick={()=>setModalOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>

            {/* HEADER */}
            <div className="modal-head">
              <h3>Record Payment</h3>
              <button onClick={()=>setModalOpen(false)}>✕</button>
            </div>

            {/* CLASS */}
            <label>Class</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
              <option value="">Select class</option>
              {[...new Set(students.map(s=>s.class))].map(c=>(
                <option key={c}>{c}</option>
              ))}
            </select>

            {/* SEARCH */}
            <label>Search Student</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} />

            {/* STUDENTS */}
            <div className="student-list">
              {filteredStudents.map(s=>(
                <div
                  key={s.id}
                  className="student-item"
                  onClick={()=>setSelectedStudent(s)}
                >
                  {s.name} ({s.class})
                </div>
              ))}
            </div>

            {selectedStudent && (
              <p className="selected">Selected: {selectedStudent.name}</p>
            )}

            {/* FEES */}
            <label>Fees</label>

            <div className="fee-grid">
              {FEE_KEYS.map(k=>(
                <div key={k} className="fee-card">
                  <div className="fee-title">{k}</div>
                  <input
                    type="number"
                    value={feeAmounts[k]||""}
                    onChange={e=>setFeeAmounts(prev=>({...prev,[k]:e.target.value}))}
                  />
                </div>
              ))}
            </div>

            {/* TOTAL */}
            <div className="total">
              <span>Total</span>
              <strong>₹ {total}</strong>
            </div>

            {/* DATE */}
            <label>Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />

            {/* MODE */}
            <label>Mode</label>
            <select value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
            </select>

            <button className="btn full" onClick={save}>
              Confirm Payment
            </button>

          </div>
        </div>
      )}

    </>
  )
}

// ─── CSS ─────────────────

const css = `
.page{padding:20px;background:#0f172a;color:#fff}
.top{display:flex;justify-content:space-between;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:20px}
.card{background:#1e293b;padding:16px;border-radius:10px}
.btn{background:#185FA5;color:white;padding:8px 14px;border:none;border-radius:6px;cursor:pointer}
.btn.full{width:100%;margin-top:14px}
table{width:100%;border-collapse:collapse}
th,td{padding:10px;border-bottom:1px solid #334155}

.overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);display:flex;justify-content:center;align-items:center}
.modal{background:#1e293b;padding:20px;border-radius:12px;width:600px;max-width:95%}

.modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
.modal-head button{background:none;border:none;color:#aaa;font-size:18px;cursor:pointer}

input,select{width:100%;padding:8px;margin-top:6px;background:#020617;color:white;border:1px solid #334155;border-radius:6px}

.student-list{max-height:140px;overflow:auto;border:1px solid #334155;margin-top:6px;border-radius:6px}
.student-item{padding:8px;cursor:pointer}
.student-item:hover{background:#1e293b}

.selected{font-size:12px;color:#4ade80}

.fee-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:10px}
.fee-card{background:#020617;padding:10px;border-radius:8px;border:1px solid #334155}
.fee-title{font-size:12px;color:#94a3b8}

.total{display:flex;justify-content:space-between;margin-top:10px;padding:10px;border:1px solid #1d4ed8;border-radius:6px}
`