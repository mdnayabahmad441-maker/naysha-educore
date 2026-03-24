"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ReportCardPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [exams,setExams] = useState<any[]>([])
  const [selectedExam,setSelectedExam] = useState<any>(null)

  const [students,setStudents] = useState<any[]>([])
  const [selectedStudent,setSelectedStudent] = useState<any>(null)

  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [result,setResult] = useState<any>(null)

  const [schoolName,setSchoolName] = useState("NaySha EduCore")

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD SCHOOL NAME
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("schools")
        .select("name")
        .eq("id", schoolId)
        .single()

      if(data) setSchoolName(data.name)
    }

    load()
  },[schoolId])

  // LOAD EXAMS
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_published", true)

      setExams(data || [])
    }

    load()
  },[schoolId])

  // LOAD EXAM DATA
  const loadExamData = async (exam:any)=>{

    setSelectedExam(exam)
    setSelectedStudent(null)
    setResult(null)

    const class_id = exam.class_id

    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)
      .eq("school_id", schoolId)

    setStudents(studentsData || [])

    // ✅ CLASS SUBJECTS FIX
    const { data:subjectData } = await supabase
      .from("class_subjects")
      .select("subjects(*)")
      .eq("class_id", class_id)

    const formattedSubjects = subjectData?.map((s:any)=>s.subjects) || []
    setSubjects(formattedSubjects)

    // MARKS
    const { data:marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", exam.id)
      .eq("school_id", schoolId)

    const map:any = {}

    marksData?.forEach((m:any)=>{
      map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
    })

    setMarksMap(map)
  }

  // GENERATE RESULT
  const generateResult = async (student:any)=>{

    let total = 0
    let obtained = 0
    let fail = false

    const rows:any[] = []

    subjects.forEach(sub=>{

      const val = marksMap[`${student.id}_${sub.id}`] || 0

      total += 100
      obtained += val

      if(val < 33) fail = true

      rows.push({
        subject: sub.name,
        marks: val
      })
    })

    const percent = Math.round((obtained/total)*100)

    // GET RANK FROM DB
    const { data:rankData } = await supabase
      .from("results")
      .select("rank, grade")
      .eq("student_id", student.id)
      .eq("exam_id", selectedExam.id)
      .single()

    setResult({
      student,
      rows,
      total,
      obtained,
      percent,
      status: fail ? "FAIL" : "PASS",
      rank: rankData?.rank,
      grade: rankData?.grade
    })
  }

  // COLOR
  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-700"
    if(p <= 60) return "bg-yellow-500"
    if(p <= 80) return "bg-green-400"
    return "bg-green-700"
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Report Card</h1>

      {/* EXAM */}
      <select
        onChange={(e)=>{
          const ex = exams.find(x=>x.id===e.target.value)
          loadExamData(ex)
        }}
        className="p-3 bg-[#0b1220] rounded-xl"
      >
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {/* STUDENT */}
      {students.length > 0 && (
        <select
          onChange={(e)=>{
            const st = students.find(s=>s.id===e.target.value)
            setSelectedStudent(st)
            generateResult(st)
          }}
          className="p-3 bg-[#0b1220] rounded-xl"
        >
          <option>Select Student</option>
          {students.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {/* REPORT */}
      {result && (

        <div className="bg-white text-black p-8 rounded-xl max-w-3xl mx-auto shadow-lg">

          {/* HEADER */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">{schoolName}</h2>
            <p>{selectedExam.name}</p>
          </div>

          {/* STUDENT */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <p><b>Name:</b> {result.student.name}</p>
            <p><b>Rank:</b> {result.rank}</p>
          </div>

          {/* TABLE */}
          <table className="w-full border text-sm mb-6">

            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Marks</th>
              </tr>
            </thead>

            <tbody>
              {result.rows.map((r:any,i:number)=>(
                <tr key={i}>
                  <td className="border p-2">{r.subject}</td>
                  <td className="border p-2">{r.marks}</td>
                </tr>
              ))}
            </tbody>

          </table>

          {/* SUMMARY */}
          <div className="flex justify-between items-center">

            <div>
              <p>Total: {result.obtained} / {result.total}</p>
              <p>Percentage: {result.percent}%</p>
              <p>Grade: {result.grade}</p>
            </div>

            <div className={`px-4 py-2 text-white rounded ${getColor(result.percent)}`}>
              {result.status}
            </div>

          </div>

          <button
            onClick={()=>window.print()}
            className="mt-6 px-4 py-2 bg-green-600 text-white rounded"
          >
            Print Report Card
          </button>

        </div>
      )}

    </div>
  )
}