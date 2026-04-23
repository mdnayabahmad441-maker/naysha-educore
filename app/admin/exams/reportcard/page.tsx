"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
import { getSettings } from "@/lib/settings"
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
  const [reportCardTemplateUrl, setReportCardTemplateUrl] = useState("")

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedExam,setSelectedExam] = useState("")
  const [reports,setReports] = useState<any[]>([])

  const [loading,setLoading] = useState(false)
  const [downloading,setDownloading] = useState(false)
  const [sending,setSending] = useState(false)

  async function init(){
    const schoolId = await getSchoolId()

    const [loadedClasses, loadedStudents, loadedSubjects, loadedExams, schoolRes, templateSetting] = await Promise.all([
      dbGet("classes"),
      dbGet("students"),
      dbGet("subjects"),
      dbGet("exams"),
      supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single(),
      getSettings("report_card_template")
    ])

    setClasses(loadedClasses)
    setStudents(loadedStudents)
    setSubjects(loadedSubjects)
    setExams(loadedExams)
    setSchool(schoolRes.data || null)
    setReportCardTemplateUrl(typeof templateSetting === "string" ? templateSetting : "")
  }

  useEffect(()=>{
    init()
  },[])

  // ==========================
  // GENERATE RESULTS (FIXED)
  // ==========================
  const generateClassResults = async ()=>{

    if(!selectedClass || !selectedExam){
      alert("Select class & exam")
      return
    }

    setLoading(true)

    try{

      const schoolId = await getSchoolId()

      if(!schoolId){
        alert("School not found")
        return
      }

      const classStudents = students.filter(
        (s)=>s.class_id === selectedClass
      )

      const { data: exSubData, error: exErr } = await supabase
        .from("exam_subjects")
        .select("*")
        .eq("exam_id", selectedExam)

      if(exErr){
        console.error(exErr)
        alert("Exam subjects error")
        return
      }

      const { data: marksDataRaw, error: marksErr } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", selectedExam)

      if(marksErr){
        console.error(marksErr)
        alert("Marks error")
        return
      }

      const exSub = exSubData || []
      const marksData = marksDataRaw || []

      const reportsTemp:any[] = []

      for(const student of classStudents){

        let totalMarks = 0
        let obtainedMarks = 0
        let hasFailedSubject = false

        const rows = exSub.map((s:any)=>{

          const subject = subjects.find(
            (sub)=>sub.id === s.subject_id
          )

          const markObj = marksData.find(
            (m:any)=>
              m.student_id === student.id &&
              m.subject_id === s.subject_id
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

        const percentage =
          totalMarks > 0 ? (obtainedMarks / totalMarks) * 100 : 0

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

        // ✅ FIXED UPSERT (NO MORE 400 ERROR)
        const { error: upsertError } = await supabase
          .from("results")
          .upsert({
            student_id: student.id,
            exam_id: selectedExam,
            class_id: selectedClass,
            school_id: schoolId,

            total_marks: totalMarks,
            obtained_marks: obtainedMarks,
            percentage: percentage,

            result: finalResult,
            grade: grade
          },{
            onConflict: "student_id,exam_id,school_id"
          })

        if(upsertError){
          console.error("UPSERT ERROR:", upsertError)
          alert("Result save failed — check console")
        }

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
      alert("Unexpected error")
    }

    setLoading(false)
  }

  // ==========================
  // PDF
  // ==========================
  const createPDFBlob = async (element:HTMLElement)=>{

    const clone = element.cloneNode(true) as HTMLElement

    clone.style.position = "fixed"
    clone.style.left = "0"
    clone.style.top = "0"
    clone.style.width = `${element.offsetWidth}px`
    clone.style.zIndex = "-1"

    document.body.appendChild(clone)

    const canvas = await html2canvas(clone,{
      scale:2,
      backgroundColor:"#fff"
    })

    document.body.removeChild(clone)

    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF()
    const w = 210
    const h = (canvas.height * w) / canvas.width

    pdf.addImage(img,"PNG",0,0,w,h)

    return pdf.output("blob")
  }

  // ==========================
  // ZIP DOWNLOAD
  // ==========================
  const downloadAllPDFs = async ()=>{

    if(reports.length === 0){
      alert("Generate first")
      return
    }

    setDownloading(true)

    const zip = new JSZip()
    const cards = document.querySelectorAll(".report-card")

    for(let i=0;i<cards.length;i++){
      const blob = await createPDFBlob(cards[i] as HTMLElement)
      zip.file(`report-${i+1}.pdf`, blob)
    }

    const content = await zip.generateAsync({ type:"blob" })
    saveAs(content, "report-cards.zip")

    setDownloading(false)
  }

  // ==========================
  // WHATSAPP
  // ==========================
  const sendWhatsApp = async ()=>{

    if(reports.length === 0){
      alert("Generate first")
      return
    }

    setSending(true)

    let success = 0
    let failed = 0

    for(const r of reports){

      const student = r.student

      if(!student.phone){
        failed++
        continue
      }

      const phone = student.phone.startsWith("+")
        ? student.phone
        : "+91" + student.phone

      try{
        const res = await fetch("/api/send-whatsapp",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            to: phone,
            message: `Hello ${student.name}, your result is ready.`
          })
        })

        if(res.ok) success++
        else failed++

      }catch{
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

      <h1 className="text-2xl mb-6">Report Cards</h1>

      <div className="flex gap-4 mb-6 flex-wrap">

        <select onChange={(e)=>setSelectedClass(e.target.value)} className="p-3 bg-[#0f172a] rounded">
          <option value="">Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select onChange={(e)=>setSelectedExam(e.target.value)} className="p-3 bg-[#0f172a] rounded">
          <option value="">Exam</option>
          {exams.map(e=>(
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <button onClick={generateClassResults} className="bg-blue-600 px-4 py-2 rounded">
          {loading ? "Generating..." : "Generate"}
        </button>

        <button onClick={downloadAllPDFs} className="bg-green-600 px-4 py-2 rounded">
          {downloading ? "Downloading..." : "Download ZIP"}
        </button>

        <button onClick={sendWhatsApp} className="bg-purple-600 px-4 py-2 rounded">
          {sending ? "Sending..." : "Send WhatsApp"}
        </button>

      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
        {reportCardTemplateUrl
          ? "Uploaded school report card template is active for generation."
          : "No report card template uploaded yet. Upload one from Settings to brand the generated reports."}
      </div>

      <div className="space-y-10">
        {reports.map((r,i)=>(
          <div key={i} className="report-card">
            <ReportCard
              student={r.student}
              report={r.report}
              school={school}
              exam={examObj}
              classData={classObj}
              templateUrl={reportCardTemplateUrl || null}
            />
          </div>
        ))}
      </div>

    </div>
  )
}
