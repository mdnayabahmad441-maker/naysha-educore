"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { createRoot } from "react-dom/client"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { useRouter } from "next/navigation"

export default function FeesPage(){

  const router = useRouter()

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [fees,setFees] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedMonth,setSelectedMonth] = useState("")

  const [selectedFee,setSelectedFee] = useState<any>(null)
  const [payAmount,setPayAmount] = useState("")

  const [loading,setLoading] = useState(false)
  const [generating,setGenerating] = useState(false)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD CLASSES =================
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))

  },[schoolId])

  // ================= LOAD SECTIONS =================
  useEffect(()=>{
    if(!selectedClass) return

    supabase.from("sections")
      .select("*")
      .eq("class_id",selectedClass)
      .then(({data})=>setSections(data || []))

  },[selectedClass])

  // ================= LOAD FEES =================
  const loadFees = async ()=>{
    if(!schoolId) return

    setLoading(true)

    let query = supabase
      .from("fees")
      .select(`*, students(name, roll_number, class_name)`)
      .eq("school_id",schoolId)

    if(selectedClass) query = query.eq("class_id",selectedClass)
    if(selectedSection) query = query.eq("section_id",selectedSection)
    if(selectedMonth) query = query.eq("month",selectedMonth)

    const { data } = await query
    setFees(data || [])
    setLoading(false)
  }

  useEffect(()=>{
    loadFees()
  },[schoolId,selectedClass,selectedSection,selectedMonth])

  // ================= RECEIPT =================
  const generateReceipt = async (f:any)=>{

    try{
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "-9999px"
      container.style.width = "800px"
      document.body.appendChild(container)

      const root = createRoot(container)

      root.render(
        <FeeReceipt
          student={f.students}
          fee={f}
          payment={{
            amount: f.paid_amount,
            date: new Date().toISOString(),
            id: f.id
          }}
        />
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)

      // 🔥 FIX OKLAB ERROR (IMPORTANT)
      container.querySelectorAll("*").forEach((el:any)=>{
        el.style.color = "#000"
        el.style.background = "#fff"
        el.style.borderColor = "#000"
        el.style.boxShadow = "none"
      })

      const canvas = await html2canvas(container,{
        scale:2,
        useCORS:true
      })

      const img = canvas.toDataURL("image/png")

      const pdf = new jsPDF("p","mm","a4")

      const width = 210
      const height = (canvas.height * width) / canvas.width

      pdf.addImage(img,"PNG",0,0,width,height)
      pdf.save(`receipt-${f.id}.pdf`)

      root.unmount()
      document.body.removeChild(container)

    }catch(e){
      console.error(e)
      alert("Receipt generation failed ❌")
    }
  }

  // ================= GENERATE FEES =================
  const generateFees = async ()=>{

    if(!selectedClass || !selectedMonth){
      alert("Select class & month")
      return
    }

    setGenerating(true)

    const { data: classFee } = await supabase
      .from("class_fee_settings")
      .select("*")
      .eq("class_id", selectedClass)
      .eq("school_id", schoolId)
      .maybeSingle()

    if(!classFee){
      alert("Set class fees first")
      setGenerating(false)
      return
    }

    const total =
      Number(classFee.tuition_fee || 0) +
      Number(classFee.transport_fee || 0) +
      Number(classFee.hostel_fee || 0)

    if(total === 0){
      alert("Fee is 0. Configure first")
      setGenerating(false)
      return
    }

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
        total_amount: total,
        paid_amount:0,
        status:"pending"
      })
    }

    alert("Fees Generated ✅")
    setGenerating(false)
    loadFees()
  }

  // ================= PAYMENT =================
  const pay = async ()=>{

    if(!selectedFee || !payAmount){
      alert("Enter amount")
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

    setPayAmount("")
    setSelectedFee(null)

    loadFees()
  }

  const statusColor = (status:string)=>{
    if(status==="paid") return "bg-green-500/20 text-green-400"
    if(status==="partial") return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  return(
    <div className="p-4 md:p-6 bg-[#020617] min-h-screen text-white">

      <h1 className="text-2xl font-semibold mb-6">Fees</h1>

      {/* RECEIPT HISTORY */}
      <button
        onClick={()=>router.push("/admin/fees/receipts")}
        className="mb-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
      >
        Receipt History
      </button>

      {/* FILTER */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">

        <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="input">
          <option value="">Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select value={selectedSection} onChange={(e)=>setSelectedSection(e.target.value)} className="input">
          <option value="">Section</option>
          {sections.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={selectedMonth} onChange={(e)=>setSelectedMonth(e.target.value)} className="input">
          <option value="">Month</option>
          <option>January</option>
          <option>February</option>
          <option>March</option>
          <option>April</option>
        </select>

        <button onClick={generateFees} className="btn bg-blue-600">
          {generating ? "Generating..." : "Generate Fees"}
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">

        {loading ? "Loading..." : (

          <table className="w-full text-sm">

            <thead className="bg-white/5 text-gray-400">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th>Month</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>

            <tbody>

              {fees.map(f=>(
                <tr key={f.id} className="border-t border-white/10">

                  <td className="p-3">{f.students?.name}</td>
                  <td>{f.month}</td>
                  <td>₹{f.total_amount}</td>
                  <td>₹{f.paid_amount}</td>

                  <td>
                    <span className={`px-2 py-1 rounded text-xs ${statusColor(f.status)}`}>
                      {f.status}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={()=>generateReceipt(f)}
                      className="px-3 py-1 bg-purple-600 rounded"
                    >
                      Receipt
                    </button>
                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        )}

      </div>

      {/* PAYMENT */}
      <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4">

        <h2 className="text-lg mb-3">Payment</h2>

        {selectedFee ? (
          <>
            <p>{selectedFee.students?.name}</p>

            <input
              value={payAmount}
              onChange={(e)=>setPayAmount(e.target.value)}
              className="input mb-3"
              placeholder="Amount"
            />

            <button onClick={pay} className="btn bg-green-600 w-full">
              Collect Payment
            </button>
          </>
        ) : (
          <p>Select a student</p>
        )}

      </div>

      <style jsx>{`
        .input{
          background:#0f172a;
          padding:10px;
          border-radius:10px;
          width:100%;
        }
        .btn{
          padding:10px 16px;
          border-radius:10px;
        }
      `}</style>

    </div>
  )
}