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

  const [resultsList,setResultsList] = useState<any[]>([])
  const [reports,setReports] = useState<any[]>([])
  const [loading,setLoading] = useState(false)
  const [downloading,setDownloading] = useState(false)

  useEffect(()=>{ init() },[])

  useEffect(()=>{
    if(selectedClass && selectedExam){
      loadResultsList()
    }
  },[selectedClass, selectedExam])

  const init = async ()=>{
    const schoolId = await getSchoolId()

    setClasses(await dbGet("classes"))
    setStudents(await dbGet("students"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))

    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("id", schoolId)
      .single()

    if(error) throw error

    setSchool(data)
  }

  const loadResultsList = async ()=>{
    const schoolId = await getSchoolId()

    const { data, error } = await supabase
      .from("results")
      .select("*")
      .eq("class_id", selectedClass)
      .eq("exam_id", selectedExam)
      .eq("school_id", schoolId)
      .order("rank",{ascending:true})

    if(error) throw error

    setResultsList(data || [])
  }

  // ===============================
  // GENERATE CLASS RESULTS
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

      const { data: exSub, error: exErr } = await supabase
        .from("exam_subjects")
        .select("*")
        .eq("exam_id", selectedExam)

      if(exErr) throw exErr
      if(!exSub) throw new Error("No exam subjects found")

      const { data: marksData, error: markErr } = await supabase
        .from("marks")
        .select("*")
        .eq("exam_id", selectedExam)

      if(markErr) throw markErr
      if(!marksData) throw new Error("No marks data found")

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

          const obtained = markObj?.marks_obtained || 0
          const total = s.total_marks || 100
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

        const percentage = (obtainedMarks / totalMarks) * 100

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

      await supabase.rpc("calculate_ranks",{
        p_exam_id:selectedExam,
        p_class_id:selectedClass,
        p_school_id:schoolId
      })

      const { data: ranked } = await supabase
        .from("results")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("exam_id", selectedExam)

      const reportsWithRank = reportsTemp.map(r=>{
        const res = ranked?.find((x:any)=>x.student_id === r.student.id)
        return {
          ...r,
          report:{
            ...r.report,
            rank: res?.rank
          }
        }
      })

      setReports(reportsWithRank)
      await loadResultsList()

      alert("Class results generated successfully")

    }catch(err){
      console.error(err)
      alert("Error generating results")
    }

    setLoading(false)
  }

  // ===============================
  // DOWNLOAD ZIP PDFs
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

        const canvas = await html2canvas(cards[i] as HTMLElement,{
          scale:2,
          backgroundColor:"#ffffff"
        })

        const img = canvas.toDataURL("image/png")

        const pdf = new jsPDF("p","mm","a4")
        const w = 210
        const h = (canvas.height * w) / canvas.width

        pdf.addImage(img,"PNG",0,0,w,h)

        const blob = pdf.output("blob")

        zip.file(`report-${i+1}.pdf`, blob)
      }

      const content = await zip.generateAsync({ type:"blob" })
      saveAs(content, "report-cards.zip")

    }catch(err){
      console.error(err)
      alert("Error generating PDFs")
    }

    setDownloading(false)
  }

  const classObj = classes.find(c=>c.id === selectedClass)
  const examObj = exams.find(e=>e.id === selectedExam)

  return(
    <div className="p-6 text-white space-y-6 bg-[#0b1220] min-h-screen">

      <h1 className="text-2xl font-semibold">Report Cards</h1>

      {/* CONTROLS */}
      <div className="flex gap-4 flex-wrap items-center">

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="p-3 bg-[#0f172a] rounded"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={selectedExam}
          onChange={(e)=>setSelectedExam(e.target.value)}
          className="p-3 bg-[#0f172a] rounded"
        >
          <option value="">Select Exam</option>
          {exams.map(e=>(
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <button
          onClick={generateClassResults}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          {loading ? "Generating..." : "Generate Class Results"}
        </button>

        <button
          onClick={downloadAllPDFs}
          className="px-4 py-2 bg-green-600 rounded"
        >
          {downloading ? "Preparing ZIP..." : "Download PDFs"}
        </button>

      </div>

      {/* RESULTS TABLE */}
      {resultsList.length > 0 && (
        <div className="bg-[#0f172a] p-4 rounded-xl border border-gray-700">
          <h2 className="mb-4 text-lg font-semibold">Class Results</h2>

          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="w-16 text-left">Rank</th>
                <th className="text-left">Name</th>
                <th className="w-24 text-center">%</th>
                <th className="w-24 text-center">Result</th>
                <th className="w-24 text-center">Grade</th>
              </tr>
            </thead>

            <tbody>
              {resultsList.map(r=>{
                const st = students.find(s=>s.id===r.student_id)
                return(
                  <tr key={r.id} className="border-b border-gray-800">
                    <td className="py-2">{r.rank}</td>
                    <td>{st?.name}</td>
                    <td className="text-center">{r.percentage?.toFixed(2)}%</td>
                    <td className={`text-center font-semibold ${r.result==="FAIL"?"text-red-400":"text-emerald-400"}`}>
                      {r.result}
                    </td>
                    <td className="text-center">{r.grade}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* REPORT CARDS */}
      {reports.length > 0 && (
        <div className="space-y-10">
          {reports.map((r,index)=>(
            <ReportCard
              key={index}
              student={r.student}
              report={r.report}
              school={school}
              exam={examObj}
              classData={classObj}
            />
          ))}
        </div>
      )}

    </div>
  )
}