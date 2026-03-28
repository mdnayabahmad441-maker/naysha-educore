"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
import ReportCard from "@/components/exams/ReportCard"

import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import JSZip from "jszip"
import { saveAs } from "file-saver"

export default function ReportCardPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [exams,setExams] = useState<any[]>([])
  const [school,setSchool] = useState<any>(null)

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedExam,setSelectedExam] = useState("")

  const [reports,setReports] = useState<any[]>([])

  const [loading,setLoading] = useState(false)
  const [downloading,setDownloading] = useState(false)
  const [sending,setSending] = useState(false)

  useEffect(()=>{ init() },[])

  const init = async ()=>{
    const schoolId = await getSchoolId()

    setClasses(await dbGet("classes"))
    setStudents(await dbGet("students"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))

    const { data } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single()

    setSchool(data)
  }

  // ===============================
  // GENERATE RESULTS
  // ===============================
  const generateClassResults = async ()=>{

    if(!selectedClass || !selectedExam){
      alert("Select class and exam")
      return
    }

    setLoading(true)

    try{

      const schoolId = await getSchoolId()

      const classStudents = students.filter(s=>s.class_id === selectedClass)

      const { data: exSub } = await supabase
        .from("exam_subjects")
        .select("*")
        .eq("exam_id", selectedExam)

      const { data: marksData } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", selectedExam)

      if(!exSub || !marksData){
        alert("Missing data")
        setLoading(false)
        return
      }

      const reportsTemp:any[] = []

      for(const student of classStudents){

        let totalMarks = 0
        let obtainedMarks = 0
        let hasFailedSubject = false

        const rows = exSub.map((s:any)=>{

          const subject = subjects.find(sub=>sub.id === s.subject_id)

          const markObj = marksData.find(
            (m:any)=>m.student_id === student.id && m.subject_id === s.subject_id
          )

          const obtained = markObj?.marks_obtained ?? 0
          const total = s.total_marks ?? 100
          const passing = Math.ceil(total * 0.33)

          totalMarks += total
          obtainedMarks += obtained

          const status = obtained >= passing ? "PASS" : "FAIL"
          if(status === "FAIL") hasFailedSubject = true

          return {
            name: subject?.name || "Unknown",
            total,
            passing,
            obtained,
            status
          }
        })

        const percentage = totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

        const finalResult =
          hasFailedSubject || percentage < 33 ? "FAIL" : "PASS"

        let grade = "F"

        if(finalResult === "PASS"){
          if(percentage >= 90) grade = "A+"
          else if(percentage >= 75) grade = "A"
          else if(percentage >= 60) grade = "B"
          else if(percentage >= 50) grade = "C"
          else grade = "D"
        }

        await supabase.from("results").upsert({
          student_id:student.id,
          exam_id:selectedExam,
          class_id:selectedClass,
          school_id:schoolId,
          total_marks:totalMarks,
          obtained_marks:obtainedMarks,
          percentage,
          result:finalResult,
          grade
        },{
          onConflict:"student_id,exam_id,school_id"
        })

        reportsTemp.push({
          student,
          report:{
            rows,
            totalMarks,
            obtainedMarks,
            percentage,
            finalResult,
            grade
          }
        })
      }

      setReports(reportsTemp)

    }catch(err){
      console.error(err)
      alert("Error generating results")
    }

    setLoading(false)
  }

  // ===============================
  // SAFE PDF
  // ===============================
  const createPDFBlob = async (element:HTMLElement)=>{

    const clone = element.cloneNode(true) as HTMLElement

    clone.style.background = "#ffffff"
    clone.style.color = "#000000"

    clone.querySelectorAll("*").forEach((el:any)=>{
      el.style.color = "#000000"
      el.style.backgroundColor = "#ffffff"
    })

    document.body.appendChild(clone)

    const canvas = await html2canvas(clone,{
      scale:2,
      backgroundColor:"#ffffff"
    })

    document.body.removeChild(clone)

    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")

    const w = 210
    const h = (canvas.height * w) / canvas.width

    pdf.addImage(img,"PNG",0,0,w,h)

    return pdf.output("blob")
  }

  // ===============================
  // DOWNLOAD ZIP
  // ===============================
  const downloadAllPDFs = async ()=>{

    if(reports.length === 0){
      alert("Generate results first")
      return
    }

    setDownloading(true)

    try{
      const zip = new JSZip()
      const cards = document.querySelectorAll(".report-card")

      for(let i=0;i<cards.length;i++){
        const blob = await createPDFBlob(cards[i] as HTMLElement)
        zip.file(`report-${i+1}.pdf`, blob)
      }

      const content = await zip.generateAsync({ type:"blob" })
      saveAs(content, "report-cards.zip")

    }catch(err){
      console.error(err)
      alert("PDF error")
    }

    setDownloading(false)
  }

  // ===============================
  // WHATSAPP FINAL
  // ===============================
  const sendWhatsApp = async ()=>{

    if(reports.length === 0){
      alert("Generate results first")
      return
    }

    setSending(true)

    const cards = document.querySelectorAll(".report-card")

    let success = 0
    let failed = 0

    for(let i=0;i<reports.length;i++){

      const student = reports[i].student

      if(!student.phone){
        console.log("❌ Missing phone:", student.name)
        failed++
        continue
      }

      const phone = student.phone.startsWith("+")
        ? student.phone
        : "+91" + student.phone

      try{

        const blob = await createPDFBlob(cards[i] as HTMLElement)

        const fileName = `report-${student.id}.pdf`

        const { error } = await supabase.storage
          .from("report-cards")
          .upload(fileName, blob, { upsert:true })

        if(error){
          console.error("Upload error:", error)
          failed++
          continue
        }

        const { data } = supabase.storage
          .from("report-cards")
          .getPublicUrl(fileName)

        const res = await fetch("/api/send-whatsapp",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: phone,
            message: `Hello ${student.name}, your report card: ${data.publicUrl}`
          })
        })

        const json = await res.json()

        if(!res.ok){
          console.error("❌ API Error:", json)
          failed++
        }else{
          console.log("✅ Sent:", student.name)
          success++
        }

      }catch(err){
        console.error(err)
        failed++
      }
    }

    alert(`Done\nSuccess: ${success}\nFailed: ${failed}`)
    setSending(false)
  }

  const classObj = classes.find(c=>c.id === selectedClass)
  const examObj = exams.find(e=>e.id === selectedExam)

  return(
    <div className="p-6 bg-[#0b1220] min-h-screen text-white">

      <h1 className="text-2xl font-semibold mb-6">Report Cards</h1>

      <div className="flex gap-4 flex-wrap mb-6">

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="bg-[#0f172a] p-3 rounded"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedExam}
          onChange={(e)=>setSelectedExam(e.target.value)}
          className="bg-[#0f172a] p-3 rounded"
        >
          <option value="">Select Exam</option>
          {exams.map(e=>(
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <button onClick={generateClassResults} className="bg-blue-600 px-4 py-2 rounded">
          {loading ? "Generating..." : "Generate"}
        </button>

        <button onClick={downloadAllPDFs} className="bg-green-600 px-4 py-2 rounded">
          {downloading ? "Preparing..." : "Download ZIP"}
        </button>

        <button onClick={sendWhatsApp} className="bg-purple-600 px-4 py-2 rounded">
          {sending ? "Sending..." : "Send WhatsApp"}
        </button>

      </div>

      <div className="space-y-10">
        {reports.map((r,index)=>(
          <div key={index} className="report-card">
            <ReportCard
              student={r.student}
              report={r.report}
              school={school}
              exam={examObj}
              classData={classObj}
            />
          </div>
        ))}
      </div>

    </div>
  )
}