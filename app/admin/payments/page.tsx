"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

interface Student {
  id: string
  name: string
  class: string
}

const FEE_KEYS = ["hostel","school","transport","misc","others"]

export default function Page() {
  const [schoolId, setSchoolId] = useState<string | null>(null)

  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])

  const [selectedClass, setSelectedClass] = useState("")
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const [modalOpen, setModalOpen] = useState(false)

  const [feeAmounts, setFeeAmounts] = useState<Record<string,string>>({})
  const [total, setTotal] = useState(0)

  const [date, setDate] = useState("")
  const [mode, setMode] = useState("cash")

  // ─── INIT ─────────────────────────────

  useEffect(() => {
    getSchoolId().then(setSchoolId)
  }, [])

  useEffect(() => {
    if (!schoolId) return
    loadStudents()
  }, [schoolId])

  // ─── LOAD STUDENTS (FIXED) ───────────

  const loadStudents = async () => {
    console.log("Loading students...")

    const { data, error } = await supabase
      .from("students")
      .select("id,name,class")
      .eq("school_id", schoolId)

    if (error) {
      console.error(error)
      alert("Failed to load students")
      return
    }

    setStudents(data || [])
    setFilteredStudents(data || [])
  }

  // ─── FILTER LOGIC ────────────────────

  useEffect(() => {
    let result = students

    if (selectedClass) {
      result = result.filter(s => s.class === selectedClass)
    }

    if (search) {
      result = result.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    setFilteredStudents(result)
  }, [selectedClass, search, students])

  // ─── TOTAL CALC ─────────────────────

  useEffect(() => {
    let sum = 0
    FEE_KEYS.forEach(k => {
      sum += Number(feeAmounts[k] || 0)
    })
    setTotal(sum)
  }, [feeAmounts])

  // ─── SAVE PAYMENT ───────────────────

  const save = async () => {
    if (!selectedStudent) {
      alert("Select student")
      return
    }

    if (total <= 0) {
      alert("Enter amount")
      return
    }

    const inserts = FEE_KEYS
      .filter(k => Number(feeAmounts[k]) > 0)
      .map(k => ({
        id: crypto.randomUUID(),
        student_id: selectedStudent.id,
        fee_type: k,
        amount: Number(feeAmounts[k]),
        school_id: schoolId,
        receipt_number: "RCPT-" + Date.now() + "-" + k,
        payment_date: new Date(date || new Date()).toISOString(),
        payment_mode: mode,
      }))

    const { error } = await supabase.from("payments").insert(inserts)

    if (error) {
      alert(error.message)
      return
    }

    alert("Saved successfully")
    setModalOpen(false)
  }

  // ─── UI ─────────────────────────────

  return (
    <>
      <style>{css}</style>

      <div className="main">
        <h2>Fee Management</h2>

        <button className="btn" onClick={()=>setModalOpen(true)}>
          + Record Payment
        </button>
      </div>

      {modalOpen && (
        <div className="overlay" onClick={()=>setModalOpen(false)}>
          <div className="modal" onClick={(e)=>e.stopPropagation()}>

            <h3>Record Payment</h3>

            {/* CLASS */}
            <label>Class</label>
            <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)}>
              <option value="">Select</option>
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
              <p>Selected: {selectedStudent.name}</p>
            )}

            {/* FEES */}
            <label>Fees</label>

            <div className="fee-grid">
              {FEE_KEYS.map(k=>(
                <div key={k} className="fee-card">
                  <div className="fee-title">{k}</div>
                  <input
                    type="number"
                    value={feeAmounts[k] || ""}
                    onChange={e=>setFeeAmounts(prev=>({
                      ...prev,
                      [k]: e.target.value
                    }))}
                  />
                </div>
              ))}
            </div>

            <div className="total-box">
              Total: ₹ {total}
            </div>

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

// ─── SAME CSS YOU GAVE ─────────────────

const css = `
body { background:#0f172a;color:white }
.btn { background:#185FA5;color:white;border:none;padding:8px 14px;border-radius:6px;cursor:pointer }
.overlay { position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;justify-content:center;align-items:center }
.modal { background:#1e293b;padding:20px;border-radius:10px;width:420px }
input,select { width:100%;padding:8px;margin-top:6px;background:#020617;border:1px solid #334155;color:white;border-radius:6px }
.fee-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px }
.fee-card { background:#020617;border:1px solid #334155;padding:10px;border-radius:8px }
.student-list { max-height:120px;overflow:auto;border:1px solid #334155;margin-top:5px }
.student-item { padding:8px;cursor:pointer }
.student-item:hover { background:#1e293b }
.total-box { margin-top:10px;padding:10px;border:1px solid #1d4ed8 }
`