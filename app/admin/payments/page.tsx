"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

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
    pending:0,
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

  // ─── LOAD STUDENTS ─────────

  const loadStudents = async () => {
    const {data} = await supabase
      .from("students")
      .select("id,name,class")
      .eq("school_id",schoolId)

    setStudents(data || [])
    setFilteredStudents(data || [])
  }

  // ─── LOAD PAYMENTS ─────────

  const loadPayments = async () => {
    const {data} = await supabase
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
    computeStats(rows)
  }

  // ─── STATS ────────────────

  const computeStats = (rows:Payment[])=>{
    const now = new Date()
    const todayStr = new Date().toISOString().split("T")[0]

    const total = rows.reduce((s,r)=>s+r.amount,0)
    const today = rows.filter(r=>r.payment_date?.startsWith(todayStr)).length

    const month = rows
      .filter(r=>{
        const d=new Date(r.payment_date)
        return d.getMonth()===now.getMonth()
      })
      .reduce((s,r)=>s+r.amount,0)

    setStats({total,pending:0,month,today})
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
    if(!selectedStudent) return alert("Select student")
    if(total<=0) return alert("Enter amount")

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

    const {error} = await supabase.from("payments").insert(inserts)

    if(error) return alert(error.message)

    setModalOpen(false)
    loadPayments()
    alert("Payment saved")
  }

  // ─── UI ───────────────────

  return (
    <>
      <style>{css}</style>

      <div className="page">

        <div className="top">
          <h2>Fee Management</h2>
          <button className="btn" onClick={()=>setModalOpen(true)}>+ Record Payment</button>
        </div>

        {/* STATS */}
        <div className="grid">
          <div className="card"><small>Total</small><h3>₹{stats.total}</h3></div>
          <div className="card"><small>Pending</small><h3 style={{color:"#f87171"}}>₹{stats.pending}</h3></div>
          <div className="card"><small>This Month</small><h3 style={{color:"#4ade80"}}>₹{stats.month}</h3></div>
          <div className="card"><small>Today</small><h3>{stats.today}</h3></div>
        </div>

        {/* TABLE */}
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Receipt</th>
              <th>Fee</th>
              <th>Amount</th>
              <th>Date</th>
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
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      {/* MODAL */}
      {modalOpen && (
        <div className="overlay" onClick={()=>setModalOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>

            <h3>Record Payment</h3>

            <label>Class</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
              <option value="">Select</option>
              {[...new Set(students.map(s=>s.class))].map(c=>(
                <option key={c}>{c}</option>
              ))}
            </select>

            <label>Search Student</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} />

            <div className="student-list">
              {filteredStudents.map(s=>(
                <div key={s.id} className="student-item" onClick={()=>setSelectedStudent(s)}>
                  {s.name} ({s.class})
                </div>
              ))}
            </div>

            {selectedStudent && <p>Selected: {selectedStudent.name}</p>}

            <label>Fees</label>

            <div className="fee-grid">
              {FEE_KEYS.map(k=>(
                <div key={k} className="fee-card">
                  <div>{k}</div>
                  <input
                    type="number"
                    value={feeAmounts[k]||""}
                    onChange={e=>setFeeAmounts(prev=>({...prev,[k]:e.target.value}))}
                  />
                </div>
              ))}
            </div>

            <div className="total">Total: ₹ {total}</div>

            <label>Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} />

            <label>Mode</label>
            <select value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
            </select>

            <br/><br/>
            <button className="btn" onClick={save}>Save</button>

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
.card{background:#1e293b;padding:12px;border-radius:8px}
.btn{background:#185FA5;color:white;padding:8px 12px;border:none;border-radius:6px;cursor:pointer}
table{width:100%;border-collapse:collapse}
th,td{padding:10px;border-bottom:1px solid #1e293b}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}
.modal{background:#1e293b;padding:20px;border-radius:10px;width:420px}
input,select{width:100%;padding:8px;margin-top:6px;background:#020617;color:white;border:1px solid #334155;border-radius:6px}
.student-list{max-height:120px;overflow:auto;border:1px solid #334155;margin-top:6px}
.student-item{padding:8px;cursor:pointer}
.student-item:hover{background:#1e293b}
.fee-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}
.fee-card{background:#020617;padding:10px;border-radius:6px;border:1px solid #334155}
.total{margin-top:10px}
`