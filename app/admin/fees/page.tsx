"use client"

import { useEffect, useRef, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
import { getSettings } from "@/lib/settings"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRouter } from "next/navigation"

export default function FeesPage(){

  const router = useRouter()
  const receiptRef = useRef<HTMLDivElement>(null)

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [fees,setFees] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedMonth,setSelectedMonth] = useState("")

  const [selectedFee,setSelectedFee] = useState<any>(null)
  const [payAmount,setPayAmount] = useState("")

  const [lastPayment,setLastPayment] = useState<any>(null)
  const [selectedStudentObj,setSelectedStudentObj] = useState<any>(null)

  const [generating,setGenerating] = useState(false)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes").select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))

    loadFees()
    loadPayments()

  },[schoolId])

  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))

  },[selectedClass])

  // ================= LOAD =================
  const loadFees = async ()=>{
    const { data } = await supabase
      .from("fees")
      .select(`*, students(name, phone, roll_number)`)
      .eq("school_id",schoolId)

    setFees(data || [])
  }

  const loadPayments = async ()=>{
    const { data } = await supabase
      .from("payments")
      .select(`*, students(name, phone)`)
      .eq("school_id",schoolId)

    setPayments(data || [])
  }

  // ================= GENERATE =================
  const generateFees = async ()=>{

    if(!selectedClass || !selectedMonth){
      alert("Select class & month")
      return
    }

    setGenerating(true)

    const settings = await getSettings("fees")

    const tuition = Number(settings?.tuition_fee || 0)
    const transport = Number(settings?.transport_fee || 0)
    const hostel = Number(settings?.hostel_fee || 0)

    let query = supabase
      .from("students")
      .select("*")
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
    loadFees()
    setGenerating(false)
  }

  // ================= PAY =================
  const pay = async ()=>{

    if(!selectedFee || !payAmount){
      alert("Select fee & amount")
      return
    }

    const amount = Number(payAmount)

    const { data: paymentData } = await supabase
      .from("payments")
      .insert({
        student_id:selectedFee.student_id,
        fee_id:selectedFee.id,
        amount,
        school_id:schoolId,
        date:new Date().toISOString()
      })
      .select()
      .single()

    const newPaid = selectedFee.paid_amount + amount

    await supabase.from("fees")
      .update({
        paid_amount:newPaid,
        status:newPaid >= selectedFee.total_amount ? "paid" : "partial"
      })
      .eq("id",selectedFee.id)

    const student = selectedFee.students

    setLastPayment(paymentData)
    setSelectedStudentObj(student)

    // 📄 PDF + WhatsApp
    setTimeout(async ()=>{
      const canvas = await html2canvas(receiptRef.current!)
      const img = canvas.toDataURL("image/png")

      const pdf = new jsPDF()
      pdf.addImage(img,"PNG",0,0,210,297)

      const blob = pdf.output("blob")

      const fileName = `receipt-${Date.now()}.pdf`

      await supabase.storage.from("receipts").upload(fileName,blob)

      const { data } = supabase.storage.from("receipts").getPublicUrl(fileName)

      if(student?.phone){
        await fetch("/api/send-whatsapp",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: student.phone,
            studentName: student.name,
            pdfUrl:data.publicUrl
          })
        })
      }

    },500)

    alert("Payment Done ✅")

    setPayAmount("")
    loadFees()
    loadPayments()
  }

  // ================= FILTERED FEES =================
  const filteredFees = fees.filter(f=>{
    return (
      (!selectedClass || f.class_id === selectedClass) &&
      (!selectedSection || f.section_id === selectedSection) &&
      (!selectedMonth || f.month === selectedMonth)
    )
  })

  const totalFees = fees.reduce((s,f)=>s+f.total_amount,0)
  const totalPaid = payments.reduce((s,p)=>s+p.amount,0)
  const totalPending = totalFees - totalPaid

  // ================= UI =================
  return(
    <div className="p-6 bg-[#020617] min-h-screen text-white">

      <h1 className="text-2xl mb-6">Fees Dashboard</h1>

      {/* TOP */}
      <div className="flex gap-3 mb-6 flex-wrap">

        <button onClick={()=>router.push("/admin/fees/receipts")} className="btn bg-purple-600">
          Receipt History
        </button>

        <select onChange={(e)=>setSelectedClass(e.target.value)} className="input">
          <option>Class</option>
          {classes.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        <select onChange={(e)=>setSelectedSection(e.target.value)} className="input">
          <option>Section</option>
          {sections.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        <select onChange={(e)=>setSelectedMonth(e.target.value)} className="input">
          <option>Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
        </select>

        <button onClick={generateFees} className="btn bg-blue-600">
          {generating ? "Generating..." : "Generate Fees"}
        </button>

      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="card">Total ₹{totalFees}</div>
        <div className="card text-green-400">Collected ₹{totalPaid}</div>
        <div className="card text-yellow-400">Pending ₹{totalPending}</div>
      </div>

      {/* TABLE */}
      <div className="card">
        <table className="w-full">
          <thead>
            <tr>
              <th>Student</th>
              <th>Month</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFees.map(f=>(
              <tr key={f.id} onClick={()=>setSelectedFee(f)} className="cursor-pointer">
                <td>{f.students?.name}</td>
                <td>{f.month}</td>
                <td>₹{f.total_amount}</td>
                <td>₹{f.paid_amount}</td>
                <td>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAYMENT */}
      {selectedFee && (
        <div className="mt-6 flex gap-3">
          <input value={payAmount} onChange={(e)=>setPayAmount(e.target.value)} className="input" />
          <button onClick={pay} className="btn bg-green-600">Pay</button>
        </div>
      )}

      {/* RECEIPT */}
      {lastPayment && selectedStudentObj && (
        <div ref={receiptRef} className="mt-6 card">
          <h2>Receipt</h2>
          <p>{selectedStudentObj.name}</p>
          <p>₹{lastPayment.amount}</p>
        </div>
      )}

      <style jsx>{`
        .input{padding:10px;background:#0f172a;border-radius:8px}
        .btn{padding:10px 16px;border-radius:8px}
        .card{padding:16px;background:#0f172a;border-radius:12px}
      `}</style>

    </div>
  )
}