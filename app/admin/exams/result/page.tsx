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
  const [marks,setMarks] = useState<any[]>([])

  const [results,setResults] = useState<any[]>([])

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD EXAMS (ONLY PUBLISHED)
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      const { data } = await supabase
        .from("results")
        .select("exam_id")

      if(!data) return

      const examIds = data.map(r=>r.exam_id)

      const { data:examData } = await supabase
        .from("exams")
        .select("*")
        .in("id", examIds)
        .eq("school_id", schoolId)

      setExams(examData || [])
    }

    load()
  },[schoolId])

  // LOAD RESULT DATA
  const loadResult = async (exam:any)=>{

    setSelectedExam(exam)

    let class_id = exam.class_id

    if(exam.is_all_classes){
      return alert("Use report card system for all classes")
    }

    // STUDENTS
    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)
      .eq("school_id", schoolId)

    setStudents(studentsData || [])

    // SUBJECTS
    const { data:subjectData } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id", schoolId)

    setSubjects(subjectData || [])

    // MARKS
    const { data:marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", exam.id)

    setMarks(marksData || [])

    calculateResults(studentsData || [], subjectData || [], marksData || [])
  }

  // CALCULATE RESULT
  const calculateResults = (students:any[], subjects:any[], marks:any[])=>{

    const res:any[] = []

    students.forEach(s=>{

      let total = 0
      let obtained = 0
      let fail = false

      const subjectMarks:any = {}

      subjects.forEach(sub=>{

        const m = marks.find(
          (mk)=>mk.student_id===s.id && mk.subject_id===sub.id
        )

        const val = m?.marks_obtained || 0

        subjectMarks[sub.name] = val

        obtained += val
        total += 100

        if(val < 33){
          fail = true
        }

      })

      const percent = Math.round((obtained/total)*100)

      res.push({
        student: s.name,
        subjectMarks,
        obtained,
        percent,
        status: fail ? "Fail" : "Pass"
      })

    })

    // RANK
    res.sort((a,b)=>b.obtained - a.obtained)

    res.forEach((r,i)=>{
      r.rank = i + 1
    })

    setResults(res)
  }

  // COLOR LOGIC
  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-800"
    if(p <= 60) return "bg-yellow-500"
    if(p <= 80) return "bg-green-400"
    return "bg-green-700"
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

          <table className="min-w-full border border-white/20">

            <thead>
              <tr>

                <th className="border p-2">Student</th>

                {subjects.map(s=>(
                  <th key={s.id} className="border p-2">
                    {s.name}
                  </th>
                ))}

                <th className="border p-2">Total</th>
                <th className="border p-2">%</th>
                <th className="border p-2">Rank</th>
                <th className="border p-2">Status</th>

              </tr>
            </thead>

            <tbody>

              {results.map((r,i)=>(
                <tr key={i} className={getColor(r.percent)}>

                  <td className="border p-2">{r.student}</td>

                  {subjects.map(s=>(
                    <td key={s.id} className="border p-2">
                      {r.subjectMarks[s.name]}
                    </td>
                  ))}

                  <td className="border p-2">{r.obtained}</td>
                  <td className="border p-2">{r.percent}%</td>
                  <td className="border p-2">{r.rank}</td>
                  <td className="border p-2">{r.status}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

    </div>
  )
}