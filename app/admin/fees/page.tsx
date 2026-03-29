"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { createRoot } from "react-dom/client"
import FeeReceipt from "@/components/fees/FeeReceipt"
import { useRouter } from "next/navigation"
import QRCode from "qrcode" // ✅ ADDED

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

  // ================= LOAD FEES (FIXED) =================
  const loadFees = async ()=>{
    if(!schoolId) return

    setLoading(true)

    let query = supabase
      .from("fees")
      .select("*")
      .eq("school_id",schoolId)

    if(selectedClass) query = query.eq("class_id",selectedClass)
    if(selectedSection) query = query.eq("section_id",selectedSection)
    if(selectedMonth) query = query.eq("month",selectedMonth)

    const { data: feeData } = await query

    if(!feeData){
      setFees([])
      setLoading(false)
      return
    }

    // ✅ FIX: removed class_name (causing 400)
    const studentIds = feeData.map(f => f.student_id)

    const { data: students } = await supabase
      .from("students")
      .select("id,name,roll_number") // ✅ FIXED
      .in("id", studentIds)

    const studentMap:any = {}
    students?.forEach(s => {
      studentMap[s.id] = s
    })

    const finalFees = feeData.map(f => ({
      ...f,
      students: studentMap[f.student_id] || null
    }))

    setFees(finalFees)
    setLoading(false)
  }

  useEffect(()=>{
    loadFees()
  },[schoolId,selectedClass,selectedSection,selectedMonth])

  // ================= RECEIPT =================
  const generateReceipt = async (f:any)=>{

    try{

      // 🚀 ADD: SAVE RECEIPT
      const { data: receipt } = await supabase
        .from("receipts")
        .insert({
          fee_id:f.id,
          student_id:f.student_id,
          school_id:schoolId,
          amount:f.paid_amount,
          receipt_number:`RCPT-${Date.now()}`
        })
        .select()
        .single()

      const publicUrl = `${window.location.origin}/receipt/${receipt.id}`

      // 🚀 ADD QR
      const qr = await QRCode.toDataURL(publicUrl)

      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.top = "-9999px"
      container.style.width = "800px"
      document.body.appendChild(container)

      const root = createRoot(container)

      root.render(
        <div>
          <img src={qr} style={{width:100,marginBottom:10}} />
          <FeeReceipt
            student={f.students || {name:"Unknown",roll_number:"-"}}
            fee={f}
            payment={{
              amount: f.paid_amount || 0,
              date: new Date().toISOString(),
              id: receipt.receipt_number
            }}
          />
        </div>
      )

      await new Promise(requestAnimationFrame)
      await new Promise(requestAnimationFrame)

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
      pdf.save(`receipt-${receipt.receipt_number}.pdf`)

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

  const statusColor = (status:string)=>{
    if(status==="paid") return "bg-green-500/20 text-green-400"
    if(status==="partial") return "bg-yellow-500/20 text-yellow-400"
    return "bg-red-500/20 text-red-400"
  }

  return(
    <div className="p-4 md:p-6 bg-[#020617] min-h-screen text-white">

      <h1 className="text-2xl font-semibold mb-6">Fees</h1>

      <button
        onClick={()=>router.push("/admin/fees/receipts")}
        className="mb-4 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700"
      >
        Receipt History
      </button>

      {/* UI SAME — NO CHANGE BELOW */}

      ...
    </div>
  )
}