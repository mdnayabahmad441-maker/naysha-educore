"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ResultPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [exams,setExams] = useState<any[]>([])
  const [selectedExam,setSelectedExam] = useState<any>(null)

  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [results,setResults] = useState<any[]>([])

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

      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_published", true)

      setExams(data || [])
    }

    load()
  },[schoolId])

  // LOAD RESULT DATA
  const loadResult = async (exam:any)=>{

    setSelectedExam(exam)

    if(exam.is_all_classes){
      alert("Use report card page for all classes")
      return
    }

    const class_id = exam.class_id

    // STUDENTS
    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)
      .eq("school_id", schoolId)

    setStudents(studentsData || [])

    // ✅ SUBJECTS (CLASS BASED)
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

    // ✅ FAST LOOKUP MAP
    const map:any = {}

    marksData?.forEach((m:any)=>{
      map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
    })

    setMarksMap(map)

    // RESULTS (FROM DB)
    const { data:resultData } = await supabase
      .from("results")
      .select("*")
      .eq("exam_id", exam.id)
      .eq("school_id", schoolId)
      .order("rank")

    setResults(resultData || [])
  }

  // COLOR LOGIC
  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-900"
    if(p <= 60) return "bg-yellow-600"
    if(p <= 80) return "bg-green-500"
    return "bg-green-800"
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Results</h1>

      {/* SELECT EXAM */}
      <select
        onChange={(e)=>{
          const ex = exams.find(x=>x.id===e.target.value)
          loadResult(ex)
        }}
        className="p-3 bg-[#0b1220] rounded-xl"
      >
        <option>Select Published Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {/* TABLE */}
      {results.length > 0 && (

        <div className="overflow-auto">

          <table className="min-w-full border border-white/20 text-sm">

            <thead>
              <tr>

                <th className="border p-2">Rank</th>
                <th className="border p-2">Student</th>

                {subjects.map(s=>(
                  <th key={s.id} className="border p-2">
                    {s.name}
                  </th>
                ))}

                <th className="border p-2">Total</th>
                <th className="border p-2">%</th>
                <th className="border p-2">Grade</th>

              </tr>
            </thead>

            <tbody>

              {results.map((r:any)=>{

                const student = students.find(s=>s.id === r.student_id)

                return(
                  <tr key={r.id} className={getColor(r.percentage)}>

                    <td className="border p-2">
                      {r.rank === 1 ? "🥇" :
                       r.rank === 2 ? "🥈" :
                       r.rank === 3 ? "🥉" :
                       r.rank}
                    </td>

                    <td className="border p-2">
                      {student?.name}
                    </td>

                    {subjects.map(sub=>{

                      const val = marksMap[`${student?.id}_${sub.id}`] || "-"

                      return(
                        <td key={sub.id} className="border p-2">
                          {val}
                        </td>
                      )
                    })}

                    <td className="border p-2">{r.total}</td>
                    <td className="border p-2">{r.percentage.toFixed(1)}%</td>
                    <td className="border p-2">{r.grade}</td>

                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>
      )}

    </div>
  )
}