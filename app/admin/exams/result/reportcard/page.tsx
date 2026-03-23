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
  const [marks,setMarks] = useState<any[]>([])

  const [result,setResult] = useState<any>(null)

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD PUBLISHED EXAMS
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      const { data:resData } = await supabase
        .from("results")
        .select("exam_id")
        .eq("is_published", true)

      const ids = resData?.map(r=>r.exam_id) || []

      const { data } = await supabase
        .from("exams")
        .select("*")
        .in("id", ids)
        .eq("school_id", schoolId)

      setExams(data || [])
    }

    load()
  },[schoolId])

  // LOAD DATA AFTER EXAM
  const loadExamData = async (exam:any)=>{

    setSelectedExam(exam)
    setSelectedStudent(null)
    setResult(null)

    let class_id = exam.class_id

    // IF ALL CLASSES → WAIT FOR CLASS SELECT
    if(exam.is_all_classes){
      setStudents([])
      return
    }

    // STUDENTS
    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)
      .eq("school_id", schoolId)

    setStudents(studentsData || [])

    // SUBJECTS
    const { data:subData } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", schoolId)

    setSubjects(subData || [])

    // MARKS
    const { data:marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", exam.id)

    setMarks(marksData || [])
  }

  // CALCULATE RESULT
  const generateResult = (student:any)=>{

    let total = 0
    let obtained = 0
    let fail = false

    const rows:any[] = []

    subjects.forEach(sub=>{

      const m = marks.find(
        (mk)=>mk.student_id===student.id && mk.subject_id===sub.id
      )

      const val = m?.marks_obtained || 0

      total += 100
      obtained += val

      if(val < 33) fail = true

      rows.push({
        subject: sub.name,
        marks: val,
        percent: val
      })
    })

    const percent = Math.round((obtained/total)*100)

    setResult({
      student,
      rows,
      total,
      obtained,
      percent,
      status: fail ? "FAIL" : "PASS"
    })
  }

  // COLOR LOGIC
  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-700"
    if(p <= 60) return "bg-yellow-500"
    if(p <= 80) return "bg-green-400"
    return "bg-green-700"
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Report Card</h1>

      {/* SELECT EXAM */}
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

      {/* SELECT STUDENT */}
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

      {/* REPORT CARD */}
      {result && (

        <div className="bg-white text-black p-8 rounded-xl shadow-lg max-w-3xl">

          {/* HEADER */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold">Your School Name</h2>
            <p>{selectedExam.name}</p>
          </div>

          {/* STUDENT INFO */}
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">

            <p><b>Name:</b> {result.student.name}</p>
            <p><b>Class:</b> {selectedExam.class_id || "Multiple"}</p>

          </div>

          {/* TABLE */}
          <table className="w-full border text-sm mb-6">

            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Subject</th>
                <th className="border p-2">Marks</th>
                <th className="border p-2">%</th>
              </tr>
            </thead>

            <tbody>

              {result.rows.map((r:any,i:number)=>(
                <tr key={i}>
                  <td className="border p-2">{r.subject}</td>
                  <td className="border p-2">{r.marks}</td>
                  <td className="border p-2">{r.percent}%</td>
                </tr>
              ))}

            </tbody>

          </table>

          {/* SUMMARY */}
          <div className="flex justify-between items-center">

            <div>
              <p>Total: {result.obtained} / {result.total}</p>
              <p>Percentage: {result.percent}%</p>
            </div>

            <div className={`px-4 py-2 text-white rounded ${getColor(result.percent)}`}>
              {result.status}
            </div>

          </div>

        </div>
      )}

    </div>
  )
}