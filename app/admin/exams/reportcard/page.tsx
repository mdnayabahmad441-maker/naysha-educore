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

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedStudent,setSelectedStudent] = useState("")
  const [selectedExam,setSelectedExam] = useState("")

  const [report,setReport] = useState<any>(null)

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    load()
  },[])

  const load = async ()=>{
    setClasses(await dbGet("classes"))
    setStudents(await dbGet("students"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))
  }

  // ================= GENERATE =================
  const generateReport = async ()=>{

    if(!selectedStudent || !selectedExam){
      alert("Select student + exam")
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

    if(hasFailedSubject){
      finalResult = "FAIL"
    } else if(percentage < 33){
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

    // 🔥 GET SCHOOL ID
    const schoolId = await getSchoolId()

    // 🔥 SAVE RESULT (UPSERT FIXED)
    const { error } = await supabase
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

    if(error){
      console.error(error)
      alert("Error saving result: " + error.message)
      return
    }

    setReport({
      rows,
      totalMarks,
      obtainedMarks,
      percentage,
      finalResult,
      grade
    })
  }

  // ================= PDF =================
  const downloadPDF = async ()=>{

    if(!reportRef.current) return

    const canvas = await html2canvas(reportRef.current)
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

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Report Card</h1>

      <div className="flex gap-4 flex-wrap">

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedStudent}
          onChange={(e)=>setSelectedStudent(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option value="">Select Student</option>
          {filteredStudents.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select
          value={selectedExam}
          onChange={(e)=>setSelectedExam(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option value="">Select Exam</option>
          {exams.map(e=>(
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <button
          onClick={generateReport}
          className="px-4 py-2 bg-white/10 rounded"
        >
          Generate
        </button>

      </div>

      {report && (

        <>
          <div ref={reportRef} className="bg-white text-black p-6 rounded-xl">

            <h2 className="text-xl font-bold mb-4">
              Student Report Card
            </h2>

            <table className="w-full border text-sm mb-6">

              <thead>
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
                    <td className={`border p-2 ${
                      r.status === "FAIL" ? "text-red-500" : "text-green-600"
                    }`}>
                      {r.status}
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

            <div className="space-y-2">
              <p>Total Marks: {report.totalMarks}</p>
              <p>Obtained: {report.obtainedMarks}</p>
              <p>Percentage: {report.percentage.toFixed(2)}%</p>

              <p className={`text-lg font-bold ${
                report.finalResult === "FAIL" ? "text-red-500" : "text-green-600"
              }`}>
                Final Result: {report.finalResult}
              </p>

              <p>Grade: {report.grade}</p>
            </div>

          </div>

          <button
            onClick={downloadPDF}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Download PDF
          </button>

        </>

      )}

    </div>
  )
}