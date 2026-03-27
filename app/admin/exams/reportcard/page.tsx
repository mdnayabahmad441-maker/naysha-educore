"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
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

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    load()
  },[])

  const load = async ()=>{
    const schoolId = await getSchoolId()

    setClasses(await dbGet("classes"))
    setStudents(await dbGet("students"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))

    const { data: schoolData } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single()

    setSchool(schoolData)
  }

  // ================= GENERATE =================
  const generateReport = async ()=>{

    if(!selectedStudent || !selectedExam || !selectedClass){
      alert("Select class + student + exam")
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
  }

  // ================= BUILD =================
  const buildReport = async (exSub:any[], marksData:any[])=>{

    let totalMarks = 0
    let obtainedMarks = 0
    let hasFailedSubject = false

    const rows = exSub.map(s=>{

      const subject = subjects.find(sub=>sub.id === s.subject_id)
      const markObj = marksData.find(m=>m.subject_id === s.subject_id)

      const obtained = markObj?.marks_obtained || 0
      const total = s.total_marks || 100
      const passing = Math.ceil(total * 0.33)

      totalMarks += total
      obtainedMarks += obtained

      const status = obtained >= passing ? "PASS" : "FAIL"

      if(status === "FAIL"){
        hasFailedSubject = true
      }

      return {
        name: subject?.name || "Unknown",
        total,
        passing,
        obtained,
        status
      }

    })

    const percentage = totalMarks > 0
      ? (obtainedMarks / totalMarks) * 100
      : 0

    let finalResult = "PASS"

    if(hasFailedSubject || percentage < 33){
      finalResult = "FAIL"
    }

    let grade = "F"

    if(finalResult === "PASS"){
      if(percentage >= 90) grade = "A+"
      else if(percentage >= 75) grade = "A"
      else if(percentage >= 60) grade = "B"
      else if(percentage >= 50) grade = "C"
      else grade = "D"
    }

    const schoolId = await getSchoolId()

    await supabase
      .from("results")
      .upsert({
        student_id: selectedStudent,
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

    await supabase.rpc("calculate_ranks", {
      p_exam_id: selectedExam,
      p_class_id: selectedClass,
      p_school_id: schoolId
    })

    const { data: resultRow } = await supabase
      .from("results")
      .select("rank")
      .eq("student_id", selectedStudent)
      .eq("exam_id", selectedExam)
      .eq("school_id", schoolId)
      .single()

    setReport({
      rows,
      totalMarks,
      obtainedMarks,
      percentage,
      finalResult,
      grade,
      rank: resultRow?.rank || "-"
    })
  }

  // ================= PDF FIXED =================
  const downloadPDF = async ()=>{

    if(!reportRef.current) return

    // 🔥 CLONE NODE (avoid Tailwind styles)
    const cloned = reportRef.current.cloneNode(true) as HTMLElement

    // 🔥 FORCE SAFE STYLES (NO OKLCH / LAB)
    cloned.style.background = "#ffffff"
    cloned.style.color = "#000000"

    // remove all problematic styles
    const all = cloned.querySelectorAll("*")
    all.forEach((el:any)=>{
      el.style.color = "#000000"
      el.style.backgroundColor = el.style.backgroundColor || "transparent"
      el.style.boxShadow = "none"
    })

    document.body.appendChild(cloned)

    const canvas = await html2canvas(cloned, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    })

    document.body.removeChild(cloned)

    const imgData = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p", "mm", "a4")

    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
    pdf.save("report-card.pdf")
  }

  const filteredStudents = students.filter(
    s => s.class_id === selectedClass
  )

  const studentObj = students.find(s=>s.id === selectedStudent)
  const classObj = classes.find(c=>c.id === selectedClass)
  const examObj = exams.find(e=>e.id === selectedExam)

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Report Card</h1>

      <div className="flex gap-4 flex-wrap">

        <select value={selectedClass} onChange={(e)=>setSelectedClass(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option value="">Select Class</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select value={selectedStudent} onChange={(e)=>setSelectedStudent(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option value="">Select Student</option>
          {filteredStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <select value={selectedExam} onChange={(e)=>setSelectedExam(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option value="">Select Exam</option>
          {exams.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>

        <button onClick={generateReport} className="px-4 py-2 bg-blue-600 rounded">
          Generate
        </button>

      </div>

      {report && (

        <>
          <div ref={reportRef} className="bg-white text-black p-8 rounded-xl w-full max-w-4xl mx-auto">

            <div className="text-center mb-6 border-b pb-4">
              <h2 className="text-2xl font-bold">{school?.name}</h2>
              <p className="text-sm">{school?.address}</p>
              <p className="text-sm">{school?.phone}</p>
              <h3 className="mt-2 text-lg font-semibold">Report Card</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <p><b>Name:</b> {studentObj?.name}</p>
              <p><b>Class:</b> {classObj?.name}</p>
              <p><b>Exam:</b> {examObj?.name}</p>
              <p><b>Rank:</b> {report.rank}</p>
            </div>

            <table className="w-full border text-sm mb-6">
              <thead style={{background:"#f3f4f6"}}>
                <tr>
                  <th className="border p-2">Subject</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Passing</th>
                  <th className="border p-2">Obtained</th>
                  <th className="border p-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r:any,i:number)=>(
                  <tr key={i}>
                    <td className="border p-2">{r.name}</td>
                    <td className="border p-2">{r.total}</td>
                    <td className="border p-2">{r.passing}</td>
                    <td className="border p-2">{r.obtained}</td>
                    <td className="border p-2" style={{color: r.status==="FAIL"?"red":"green"}}>
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between mt-6">
              <div>
                <p>Total Marks: {report.totalMarks}</p>
                <p>Obtained: {report.obtainedMarks}</p>
                <p>Percentage: {report.percentage.toFixed(2)}%</p>
              </div>

              <div className="text-right">
                <p style={{color: report.finalResult==="FAIL"?"red":"green"}}>
                  {report.finalResult}
                </p>
                <p>Grade: {report.grade}</p>
              </div>
            </div>

          </div>

          <div className="flex justify-center">
            <button onClick={downloadPDF} className="px-6 py-2 bg-green-600 rounded">
              Download PDF
            </button>
          </div>

        </>

      )}

    </div>
  )
}