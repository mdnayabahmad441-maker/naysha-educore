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

  const pdfRef = useRef<HTMLDivElement>(null)

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
      alert("Report already generated. Only admin can edit.")
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
      if(status === "FAIL") hasFailedSubject = true

      return { name: subject?.name || "Unknown", total, passing, obtained, status }
    })

    const percentage = (obtainedMarks / totalMarks) * 100
    const finalResult = (hasFailedSubject || percentage < 33) ? "FAIL" : "PASS"

    let grade = "F"
    if(finalResult === "PASS"){
      if(percentage >= 90) grade = "A+"
      else if(percentage >= 75) grade = "A"
      else if(percentage >= 60) grade = "B"
      else if(percentage >= 50) grade = "C"
      else grade = "D"
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
      .single()

    setReport({ rows,totalMarks,obtainedMarks,percentage,finalResult,grade,rank:data?.rank })
    setAlreadyGenerated(true)
  }

  const downloadPDF = async ()=>{
    if(!pdfRef.current || !report) return

    const canvas = await html2canvas(pdfRef.current,{
      scale:2,
      backgroundColor:"#ffffff"
    })

    const img = canvas.toDataURL("image/png")

    const pdf = new jsPDF("p","mm","a4")
    pdf.addImage(img,"PNG",0,0,210,297)
    pdf.save("report-card.pdf")
  }

  const studentObj = students.find(s=>s.id === selectedStudent)
  const classObj = classes.find(c=>c.id === selectedClass)
  const examObj = exams.find(e=>e.id === selectedExam)

  return(
    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Report Card</h1>

      {report && (
        <div className="flex justify-center">
          <button onClick={downloadPDF} className="px-6 py-2 bg-green-600 rounded">
            Save & Download PDF
          </button>
        </div>
      )}

      {/* PDF TEMPLATE */}
      <div style={{position:"absolute",left:"-9999px"}}>
        <div ref={pdfRef} style={{
          width:"794px",
          minHeight:"1123px",
          padding:"50px",
          background:"#fff",
          fontFamily:"Georgia, serif"
        }}>

          {/* HEADER */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            
            {/* SAFE LOGO */}
            {school?.logo_url ? (
              <img src={school.logo_url} style={{height:"60px"}} />
            ) : (
              <div style={{fontWeight:"bold"}}>{school?.name?.slice(0,2)}</div>
            )}

            <div style={{textAlign:"center"}}>
              <h1 style={{margin:0,color:"#1e3a8a"}}>{school?.name}</h1>
              <p style={{margin:0,color:"#6b7280"}}>Academic Report Card</p>
            </div>

            <div style={{fontSize:"12px"}}>NaySha EduCore</div>
          </div>

          <hr style={{margin:"20px 0"}} />

          {/* STUDENT */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 120px",gap:"20px"}}>
            <div>
              <p><b>Name:</b> {studentObj?.name}</p>
              <p><b>Class:</b> {classObj?.name}</p>
              <p><b>Exam:</b> {examObj?.name}</p>
              <p><b>Rank:</b> {report?.rank}</p>
            </div>

            {/* SAFE PHOTO */}
            {studentObj?.photo_url ? (
              <img src={studentObj.photo_url} style={{
                width:"120px",height:"120px",objectFit:"cover"
              }} />
            ) : (
              <div style={{
                width:"120px",height:"120px",
                border:"1px solid #ccc",
                display:"flex",
                alignItems:"center",
                justifyContent:"center"
              }}>
                No Photo
              </div>
            )}
          </div>

          {/* TABLE */}
          <table style={{width:"100%",marginTop:"30px",borderCollapse:"collapse"}}>
            <tbody>
              {report?.rows?.map((r:any,i:number)=>(
                <tr key={i}>
                  <td style={{border:"1px solid #ddd"}}>{r.name}</td>
                  <td style={{border:"1px solid #ddd"}}>{r.obtained}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* SUMMARY */}
          <div style={{marginTop:"20px"}}>
            <p>Total: {report?.totalMarks}</p>
            <p>Percentage: {report?.percentage?.toFixed(2)}%</p>
            <p>Result: {report?.finalResult}</p>
            <p>Grade: {report?.grade}</p>
          </div>

        </div>
      </div>

    </div>
  )
}