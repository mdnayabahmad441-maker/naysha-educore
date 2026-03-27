"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
import { getUserRole } from "@/lib/getUserRole"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function ReportCardPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [exams,setExams] = useState<any[]>([])
  const [school,setSchool] = useState<any>(null)

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedStudent,setSelectedStudent] = useState("")
  const [selectedExam,setSelectedExam] = useState("")

  const [report,setReport] = useState<any>(null)
  const [alreadyGenerated,setAlreadyGenerated] = useState(false)
  const [resultsList,setResultsList] = useState<any[]>([])
  const [role,setRole] = useState("")

  const darkRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{ init() },[])

  useEffect(()=>{
    if(selectedClass && selectedExam){
      loadResultsList()
    }
  },[selectedClass, selectedExam])

  const init = async ()=>{
    const schoolId = await getSchoolId()
    const roleData = await getUserRole()
    setRole(roleData?.role || "")

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

  const checkExisting = async ()=>{
    const schoolId = await getSchoolId()

    const { data } = await supabase
      .from("results")
      .select("*")
      .eq("student_id", selectedStudent)
      .eq("exam_id", selectedExam)
      .eq("school_id", schoolId)
      .maybeSingle()

    setAlreadyGenerated(!!data)
    return data
  }

  const loadResultsList = async ()=>{
    const schoolId = await getSchoolId()

    const { data } = await supabase
      .from("results")
      .select("*")
      .eq("class_id", selectedClass)
      .eq("exam_id", selectedExam)
      .eq("school_id", schoolId)
      .order("rank",{ascending:true})

    setResultsList(data || [])
  }

  const generateReport = async ()=>{

    if(!selectedStudent || !selectedExam || !selectedClass){
      alert("Select class + student + exam")
      return
    }

    const existing = await checkExisting()

    if(existing && role !== "admin"){
      alert("Already generated. Only admin can edit.")
      return
    }

    const { data: exSub } = await supabase
      .from("exam_subjects")
      .select("*")
      .eq("exam_id", selectedExam)

    const { data: marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("student_id", selectedStudent)
      .eq("exam_id", selectedExam)

    await buildReport(exSub || [], marksData || [])
    await loadResultsList()
  }

  const buildReport = async (exSub:any[], marksData:any[])=>{

    let totalMarks = 0
    let obtainedMarks = 0
    let hasFailed = false

    const rows = exSub.map(s=>{
      const subject = subjects.find(x=>x.id===s.subject_id)
      const mark = marksData.find(m=>m.subject_id===s.subject_id)

      const obtained = mark?.marks_obtained || 0
      const total = s.total_marks || 100
      const passing = Math.ceil(total*0.33)

      totalMarks += total
      obtainedMarks += obtained

      const status = obtained>=passing ? "PASS":"FAIL"
      if(status==="FAIL") hasFailed = true

      return { name:subject?.name,total,passing,obtained,status }
    })

    const percentage = (obtainedMarks/totalMarks)*100
    const finalResult = (hasFailed || percentage<33) ? "FAIL":"PASS"

    let grade="F"
    if(finalResult==="PASS"){
      if(percentage>=90) grade="A+"
      else if(percentage>=75) grade="A"
      else if(percentage>=60) grade="B"
      else if(percentage>=50) grade="C"
      else grade="D"
    }

    const schoolId = await getSchoolId()

    await supabase.from("results").upsert({
      student_id:selectedStudent,
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

    await supabase.rpc("calculate_ranks",{
      p_exam_id:selectedExam,
      p_class_id:selectedClass,
      p_school_id:schoolId
    })

    const { data } = await supabase
      .from("results")
      .select("rank")
      .eq("student_id",selectedStudent)
      .eq("exam_id",selectedExam)
      .single()

    setReport({ rows,totalMarks,obtainedMarks,percentage,finalResult,grade,rank:data?.rank })
    setAlreadyGenerated(true)
  }

  // ================= DARK PDF =================
  const downloadDarkPDF = async ()=>{
    if(!darkRef.current) return

    const canvas = await html2canvas(darkRef.current,{scale:2})
    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    const w = 210
    const h = (canvas.height*w)/canvas.width

    pdf.addImage(img,"PNG",0,0,w,h)
    pdf.save("report-dark.pdf")
  }

  // ================= PRINT PDF =================
  const downloadPrintPDF = async ()=>{
    if(!printRef.current) return

    const canvas = await html2canvas(printRef.current,{scale:2})
    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    const w = 210
    const h = (canvas.height*w)/canvas.width

    pdf.addImage(img,"PNG",0,0,w,h)
    pdf.save("report-print.pdf")
  }

  const filteredStudents = students.filter(s=>s.class_id===selectedClass)

  return(
    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Report Card</h1>

      {/* SELECTORS */}
      <div className="flex gap-4 flex-wrap">
        <select onChange={e=>setSelectedClass(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option>Select Class</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select onChange={e=>setSelectedStudent(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option>Select Student</option>
          {filteredStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select onChange={e=>setSelectedExam(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option>Select Exam</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <button onClick={generateReport} className="px-4 py-2 bg-blue-600 rounded">
          Generate
        </button>
      </div>

      {/* BUTTONS */}
      {report && (
        <div className="flex gap-4">
          <button onClick={downloadDarkPDF} className="px-4 py-2 bg-indigo-600 rounded">
            Download WhatsApp PDF
          </button>

          <button onClick={downloadPrintPDF} className="px-4 py-2 bg-yellow-600 rounded">
            Download Print PDF
          </button>
        </div>
      )}

      {/* HIDDEN TEMPLATES */}

      {/* DARK */}
      <div ref={darkRef} style={{position:"absolute",left:"-9999px"}}>
        <div style={{padding:"30px",background:"#020617",color:"#fff"}}>
          <h1>{school?.name}</h1>
          <p>{report?.finalResult} - Grade {report?.grade}</p>
        </div>
      </div>

      {/* PRINT */}
      <div ref={printRef} style={{position:"absolute",left:"-9999px"}}>
        <div style={{padding:"30px",background:"#fff",color:"#000"}}>
          <h1>{school?.name}</h1>
          <p>{report?.finalResult} - Grade {report?.grade}</p>
        </div>
      </div>

    </div>
  )
}