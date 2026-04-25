"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

export default function ResultPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [exams,setExams] = useState<any[]>([])
  const [selectedExam,setSelectedExam] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [results,setResults] = useState<any[]>([])

  const [loading,setLoading] = useState(false)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD EXAMS =================
  useEffect(()=>{
    if(!schoolId) return

    const loadExams = async ()=>{

      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("school_id", schoolId)
        .eq("is_published", true)

      if(error){
        console.error("Exam error:", error)
        return
      }

      setExams(data || [])
    }

    loadExams()

  },[schoolId])

  // ================= LOAD RESULT =================
  const loadResult = async (examId:string)=>{

    if(!examId || !schoolId) return

    setLoading(true)

    try{

      const exam = exams.find(e=>String(e.id) === String(examId))

      if(!exam){
        alert("Exam not found")
        return
      }

      if(exam.is_all_classes){
        alert("Use report card for multi-class")
        return
      }

      const class_id = exam.class_id

      // STUDENTS via enrollments
      const year = await getActiveAcademicYear()
      let enrollQuery = supabase
        .from("student_enrollments")
        .select("student_id, students:student_id(id, name)")
        .eq("class_id", class_id)
        .eq("school_id", schoolId)

      if(year) enrollQuery = enrollQuery.eq("academic_year_id", year.id)

      const { data: enrollments } = await enrollQuery
      const studentsData = (enrollments || []).map((e: any) => ({
        id: e.student_id,
        name: e.students?.name ?? "Unknown"
      }))

      setStudents(studentsData)

      // ✅ SUBJECTS
      const { data:subjectData } = await supabase
        .from("exam_subjects")
        .select(`
          subject_id,
          subjects(name)
        `)
        .eq("exam_id", exam.id)

      const formattedSubjects = subjectData?.map((s:any)=>({
        id: s.subject_id,
        name: s.subjects?.name || "Subject"
      })) || []

      setSubjects(formattedSubjects)

      // ✅ MARKS
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

      // ✅ RESULTS
      const { data:resultData } = await supabase
        .from("results")
        .select("*")
        .eq("exam_id", exam.id)
        .eq("school_id", schoolId)

      const sorted = (resultData || [])
        .sort((a:any,b:any)=> (b.percentage || 0) - (a.percentage || 0))
        .map((r:any,i:number)=>({
          ...r,
          rank: r.rank || i+1
        }))

      setResults(sorted)

    }catch(err){
      console.error("LOAD ERROR:", err)
    }finally{
      setLoading(false)
    }
  }

  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-900"
    if(p <= 60) return "bg-yellow-600"
    if(p <= 80) return "bg-green-500"
    return "bg-green-800"
  }

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Results</h1>

      {/* SELECT EXAM */}
      <select
        value={selectedExam}
        onChange={(e)=>{
          setSelectedExam(e.target.value)
          loadResult(e.target.value) // 🔥 FIXED trigger
        }}
        className="p-3 bg-[#0b1220]"
      >
        <option value="">Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {/* LOADING */}
      {loading && (
        <p className="text-gray-400">Loading results...</p>
      )}

      {/* EMPTY */}
      {!loading && selectedExam && results.length === 0 && (
        <p className="text-gray-400">No results found</p>
      )}

      {/* TABLE */}
      {results.length > 0 && (

        <table className="w-full border text-sm">

          <thead>
            <tr>
              <th className="p-2">Rank</th>
              <th className="p-2">Name</th>
              {subjects.map(s=>(
                <th key={s.id} className="p-2">{s.name}</th>
              ))}
              <th className="p-2">Total</th>
              <th className="p-2">%</th>
              <th className="p-2">Grade</th>
            </tr>
          </thead>

          <tbody>

            {results.map(r=>{

              const st = students.find(s=>s.id === r.student_id)

              return(
                <tr key={r.id} className={getColor(Number(r.percentage || 0))}>

                  <td className="p-2 font-bold">{r.rank}</td>

                  <td className="p-2">{st?.name || "Unknown"}</td>

                  {subjects.map(sub=>(
                    <td key={sub.id} className="p-2">
                      {marksMap[`${st?.id}_${sub.id}`] ?? "-"}
                    </td>
                  ))}

                  <td className="p-2">{r.total}</td>

                  <td className="p-2">
                    {Number(r.percentage || 0).toFixed(1)}%
                  </td>

                  <td className="p-2 font-semibold">{r.grade}</td>

                </tr>
              )
            })}

          </tbody>

        </table>
      )}

    </div>
  )
}