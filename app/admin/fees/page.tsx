"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getSettings } from "@/lib/settings"

export default function FeesPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedMonth,setSelectedMonth] = useState("")

  const [selectedFee,setSelectedFee] = useState<any>(null)
  const [payAmount,setPayAmount] = useState("")

  const [loading,setLoading] = useState(false)

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))

  },[schoolId])

  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))

  },[selectedClass])

  useEffect(()=>{
    if(!selectedClass) return

    let query = supabase
      .from("fees")
      .select(`
        *,
        students(name, roll_number)
      `)
      .eq("class_id",selectedClass)

    if(selectedSection){
      query = query.eq("section_id",selectedSection)
    }

    if(selectedMonth){
      query = query.eq("month",selectedMonth)
    }

    query.then(({data})=>setFees(data || []))

  },[selectedClass,selectedSection,selectedMonth])

  // ================= GENERATE =================
  const generateFees = async ()=>{

    if(!selectedClass || !selectedMonth){
      alert("Select class & month")
      return
    }

    setLoading(true)

    const settings = await getSettings("fees")

    const tuition = Number(settings?.tuition_fee || 0)
    const transport = Number(settings?.transport_fee || 0)
    const hostel = Number(settings?.hostel_fee || 0)

    let query = supabase
      .from("students")
      .select("*")
      .eq("school_id",schoolId)
      .eq("class_id",selectedClass)

    if(selectedSection){
      query = query.eq("section_id",selectedSection)
    }

    const { data: students } = await query

    for(const s of students || []){

      const { data: existing } = await supabase
        .from("fees")
        .select("id")
        .eq("student_id",s.id)
        .eq("month",selectedMonth)
        .maybeSingle()

      if(existing) continue

      await supabase.from("fees").insert({
        student_id:s.id,
        school_id:schoolId,
        class_id:s.class_id,
        section_id:s.section_id,
        month:selectedMonth,

        total_amount: tuition + transport + hostel,
        paid_amount:0,
        status:"pending",

        tuition_fee:tuition,
        transport_fee:transport,
        hostel_fee:hostel
      })
    }

    alert("Fees Generated ✅")
    setLoading(false)
  }

  // ================= PAY =================
  const pay = async ()=>{

    if(!selectedFee || !payAmount){
      alert("Select fee + amount")
      return
    }

    const amount = Number(payAmount)

    await supabase.from("payments").insert({
      student_id:selectedFee.student_id,
      fee_id:selectedFee.id,
      amount,
      school_id:schoolId,
      date:new Date().toISOString()
    })

    const newPaid = selectedFee.paid_amount + amount

    await supabase.from("fees")
      .update({
        paid_amount:newPaid,
        status:newPaid >= selectedFee.total_amount ? "paid" : "partial"
      })
      .eq("id",selectedFee.id)

    alert("Payment done ✅")

    setPayAmount("")
    setSelectedFee(null)
  }

  // ================= UI =================
  return(
    <div className="p-6 bg-[#020617] min-h-screen text-white">

      <h1 className="text-2xl mb-6">Fees</h1>

      {/* FILTERS */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">

        <select onChange={(e)=>setSelectedClass(e.target.value)} className="input">
          <option>Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select onChange={(e)=>setSelectedSection(e.target.value)} className="input">
          <option>Section</option>
          {sections.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select onChange={(e)=>setSelectedMonth(e.target.value)} className="input">
          <option>Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
        </select>

        <button onClick={generateFees} className="btn bg-blue-600">
          {loading ? "Generating..." : "Generate"}
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-[#0f172a] rounded-xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-[#020617]">
            <tr>
              <th className="p-3">Student</th>
              <th>Month</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>

            {fees.map(f=>(
              <tr
                key={f.id}
                className="border-t border-white/10 cursor-pointer hover:bg-white/5"
                onClick={()=>setSelectedFee(f)}
              >
                <td className="p-3">{f.students?.name}</td>
                <td>{f.month}</td>
                <td>₹{f.total_amount}</td>
                <td>₹{f.paid_amount}</td>
                <td>
                  <span className={
                    f.status === "paid"
                      ? "text-green-400"
                      : f.status === "partial"
                      ? "text-yellow-400"
                      : "text-red-400"
                  }>
                    {f.status}
                  </span>
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* PAYMENT PANEL */}
      {selectedFee && (
        <div className="mt-6 flex gap-3">

          <input
            value={payAmount}
            onChange={(e)=>setPayAmount(e.target.value)}
            placeholder="Enter amount"
            className="input"
          />

          <button onClick={pay} className="btn bg-green-600">
            Pay
          </button>

        </div>
      )}

      <style jsx>{`
        .input {
          background:#0f172a;
          padding:10px;
          border-radius:8px;
          width:100%;
        }
        .btn {
          padding:10px 16px;
          border-radius:8px;
        }
      `}</style>

    </div>
  )
}