"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ResultPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [exams,setExams] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [results,setResults] = useState<any[]>([])

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_published", true)
      .then(({data})=>setExams(data || []))
  },[schoolId])

  const loadResult = async (exam:any)=>{

    if(exam.is_all_classes){
      alert("Use report card for multi-class")
      return
    }

    const class_id = exam.class_id

    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)
      .eq("school_id", schoolId)

    setStudents(studentsData || [])

    // SUBJECTS FROM EXAM
    const { data:subjectData } = await supabase
      .from("exam_subjects")
      .select("subjects(*)")
      .eq("exam_id", exam.id)

    const formatted = subjectData?.map((s:any)=>s.subjects) || []
    setSubjects(formatted)

    // MARKS MAP
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

    // RESULTS
    const { data:resultData } = await supabase
      .from("results")
      .select("*")
      .eq("exam_id", exam.id)
      .eq("school_id", schoolId)
      .order("rank")

    setResults(resultData || [])
  }

  const getColor = (p:number)=>{
    if(p<33) return "bg-red-900"
    if(p<=60) return "bg-yellow-600"
    if(p<=80) return "bg-green-500"
    return "bg-green-800"
  }

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Results</h1>

      <select
        onChange={(e)=>{
          const ex = exams.find(x=>x.id===e.target.value)
          loadResult(ex)
        }}
        className="p-3 bg-[#0b1220]"
      >
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {results.length > 0 && (

        <table className="w-full border text-sm">

          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              {subjects.map(s=><th key={s.id}>{s.name}</th>)}
              <th>Total</th>
              <th>%</th>
              <th>Grade</th>
            </tr>
          </thead>

          <tbody>

            {results.map(r=>{

              const st = students.find(s=>s.id === r.student_id)

              return(
                <tr key={r.id} className={getColor(r.percentage)}>

                  <td>{r.rank}</td>
                  <td>{st?.name}</td>

                  {subjects.map(sub=>(
                    <td key={sub.id}>
                      {marksMap[`${st?.id}_${sub.id}`] || "-"}
                    </td>
                  ))}

                  <td>{r.total}</td>
                  <td>{r.percentage.toFixed(1)}%</td>
                  <td>{r.grade}</td>

                </tr>
              )
            })}

          </tbody>

        </table>
      )}

    </div>
  )
}