"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type AiSubjectInsight = { subject: string; observation: string }

type AiResultAnalysis = {
  overview: string
  topPerformers: string[]
  needsAttention: string[]
  subjectInsights: AiSubjectInsight[]
  recommendation: string
}

export default function ResultPage(){

  const school = useSchool()
  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [exams,setExams] = useState<any[]>([])
  const [selectedExam,setSelectedExam] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [results,setResults] = useState<any[]>([])

  const [loading,setLoading] = useState(false)

  const [aiAnalysis, setAiAnalysis] = useState<AiResultAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

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

  const analyseResults = async () => {
    if (!schoolId || !results.length) return

    setAiLoading(true)
    setAiAnalysis(null)

    try {
      const exam = exams.find(e => String(e.id) === String(selectedExam))
      const examName = exam?.name || "Exam"
      const className = exam?.class_id ? "" : "Class"

      const resultPayload = results.map(r => {
        const st = students.find(s => s.id === r.student_id)
        return {
          name: st?.name || "Unknown",
          percentage: Number(r.percentage || 0),
          grade: r.grade || "N/A"
        }
      })

      const subjectAvgs = subjects.map(sub => {
        const marks = students
          .map(s => Number(marksMap[`${s.id}_${sub.id}`] ?? null))
          .filter(m => !isNaN(m) && m !== null)
        const avg = marks.length
          ? marks.reduce((a, b) => a + b, 0) / marks.length
          : 0
        return { name: sub.name, classAvg: avg }
      })

      const res = await apiFetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "result_analysis",
          schoolId,
          schoolName: school?.name || "School",
          examName,
          className,
          results: resultPayload,
          subjects: subjectAvgs
        })
      })

      const json = await res.json()
      if (!res.ok || !json?.data) throw new Error(json?.error || "AI failed")
      setAiAnalysis(json.data as AiResultAnalysis)
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI analysis failed")
    } finally {
      setAiLoading(false)
    }
  }

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Results</h1>

      {/* SELECT EXAM */}
      <select
        value={selectedExam}
        onChange={(e)=>{
          setSelectedExam(e.target.value)
          setAiAnalysis(null)
          loadResult(e.target.value)
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

      {/* AI ANALYSE BUTTON */}
      {results.length > 0 && (
        <button
          onClick={analyseResults}
          disabled={aiLoading}
          className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-5 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {aiLoading ? "Analysing..." : "✦ AI Analyse Results"}
        </button>
      )}

      {/* AI ANALYSIS PANEL */}
      {aiAnalysis && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✦</span>
            <h2 className="font-semibold text-cyan-100">AI Performance Analysis</h2>
          </div>

          <p className="text-sm text-gray-200 leading-relaxed">{aiAnalysis.overview}</p>

          <div className="grid md:grid-cols-2 gap-4">
            {aiAnalysis.topPerformers.length > 0 && (
              <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">Top Performers</p>
                {aiAnalysis.topPerformers.map((name, i) => (
                  <p key={i} className="text-sm text-green-200">🏆 {name}</p>
                ))}
              </div>
            )}

            {aiAnalysis.needsAttention.length > 0 && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 space-y-2">
                <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Needs Attention</p>
                {aiAnalysis.needsAttention.map((name, i) => (
                  <p key={i} className="text-sm text-red-200">⚠ {name}</p>
                ))}
              </div>
            )}
          </div>

          {aiAnalysis.subjectInsights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Subject Insights</p>
              {aiAnalysis.subjectInsights.map((s, i) => (
                <div key={i} className="rounded-xl bg-white/5 p-3 flex gap-3">
                  <span className="text-sm font-medium text-white shrink-0">{s.subject}:</span>
                  <span className="text-sm text-gray-300">{s.observation}</span>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-blue-400/20 bg-blue-500/5 p-4">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-1">Recommendation</p>
            <p className="text-sm text-blue-200">{aiAnalysis.recommendation}</p>
          </div>
        </div>
      )}

    </div>
  )
}