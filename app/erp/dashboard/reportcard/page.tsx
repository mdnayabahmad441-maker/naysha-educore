"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import jsPDF from "jspdf"

export default function ReportCardPage(){

  const [students,setStudents] = useState<any[]>([])
  const [exams,setExams] = useState<any[]>([])
  const [results,setResults] = useState<any[]>([])

  const [studentId,setStudentId] = useState("")
  const [examId,setExamId] = useState("")
  const [studentName,setStudentName] = useState("")
  const [examName,setExamName] = useState("")

  async function fetchData(){

    const {data:studentsData} =
      await supabase.from("students").select("*")

    const {data:examsData} =
      await supabase.from("exams").select("*")

    if(studentsData) setStudents(studentsData)
    if(examsData) setExams(examsData)

  }

  useEffect(()=>{
    fetchData()
  },[])

  async function loadResults(){

    const {data} = await supabase
      .from("results")
      .select("*")
      .eq("student_id",studentId)
      .eq("exam_id",examId)

    if(data){
      setResults(data)
    }

    const student = students.find(s => s.id === studentId)
    const exam = exams.find(e => e.id === examId)

    if(student) setStudentName(student.name)
    if(exam) setExamName(exam.name)
  }

  const total =
    results.reduce((sum,r)=>sum+Number(r.marks),0)

  const percentage =
    results.length>0 ? (total/(results.length*100))*100 : 0

  function getGrade(){

    if(percentage >= 90) return "A+"
    if(percentage >= 80) return "A"
    if(percentage >= 70) return "B"
    if(percentage >= 60) return "C"
    if(percentage >= 50) return "D"
    return "F"

  }

  function downloadPDF(){

    const pdf = new jsPDF()

    pdf.setFontSize(18)
    pdf.text("NaySha EduCore School",20,20)

    pdf.setFontSize(14)
    pdf.text("Student Report Card",20,35)

    pdf.setFontSize(12)

    pdf.text("Student: "+studentName,20,50)
    pdf.text("Exam: "+examName,20,60)

    let y = 80

    results.forEach((r:any)=>{
      pdf.text(r.subject + " : " + r.marks,20,y)
      y += 10
    })

    pdf.text("Total: "+total,20,y+10)
    pdf.text("Percentage: "+percentage.toFixed(2)+"%",20,y+20)
    pdf.text("Grade: "+getGrade(),20,y+30)

    pdf.save("report-card.pdf")

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Report Card Generator
      </h1>

      <div className="bg-white/10 p-6 rounded-xl mb-8 w-[400px]">

        <select
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setStudentId(e.target.value)}
        >

          <option>Select Student</option>

          {students.map((s)=>(
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}

        </select>

        <select
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setExamId(e.target.value)}
        >

          <option>Select Exam</option>

          {exams.map((e)=>(
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}

        </select>

        <button
        onClick={loadResults}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Generate Report
        </button>

      </div>

      {results.length>0 && (

      <div className="bg-white/10 p-8 rounded-xl w-[600px]">

        <h2 className="text-2xl font-bold mb-4">
          School Report Card
        </h2>

        <p className="mb-2">Student: {studentName}</p>
        <p className="mb-4">Exam: {examName}</p>

        <table className="w-full mb-6">

          <thead>
            <tr className="text-left text-gray-400">
              <th>Subject</th>
              <th>Marks</th>
            </tr>
          </thead>

          <tbody>

            {results.map((r)=>(
              <tr key={r.id} className="border-t border-gray-700">

                <td className="py-2">{r.subject}</td>
                <td>{r.marks}</td>

              </tr>
            ))}

          </tbody>

        </table>

        <div className="text-lg font-bold">
          Total: {total}
        </div>

        <div className="text-lg font-bold">
          Percentage: {percentage.toFixed(2)}%
        </div>

        <div className="text-lg font-bold mb-6">
          Grade: {getGrade()}
        </div>

        <button
        onClick={downloadPDF}
        className="px-4 py-2 bg-green-600 rounded"
        >
        Download Report Card
        </button>

      </div>

      )}

    </div>
  )
}