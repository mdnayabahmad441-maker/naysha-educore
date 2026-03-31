"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ResultPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [exams,setExams] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [marksMap,setMarksMap] = useState<any>({})
  const [results,setResults] = useState<any[]>([])

  const [selectedExam,setSelectedExam] = useState("")
  const [search,setSearch] = useState("")
  const [sort,setSort] = useState("rank")

  // INIT
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // LOAD EXAMS
  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .eq("is_published", true)
      .then(({data})=>setExams(data || []))
  },[schoolId])

  // LOAD RESULT
  const loadResult = async ()=>{

    const exam = exams.find(e=>String(e.id) === selectedExam)
    if(!exam) return

    if(exam.is_all_classes){
      alert("Use report card for multi-class")
      return
    }

    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", exam.class_id)

    setStudents(studentsData || [])

    const { data:subjectData } = await supabase
      .from("exam_subjects")
      .select(`subject_id, subjects(name)`)
      .eq("exam_id", exam.id)

    setSubjects(subjectData?.map((s:any)=>({
      id: s.subject_id,
      name: s.subjects?.name
    })) || [])

    const { data:marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", exam.id)

    const map:any = {}
    marksData?.forEach((m:any)=>{
      map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
    })
    setMarksMap(map)

    const { data:resultData } = await supabase
      .from("results")
      .select("*")
      .eq("exam_id", exam.id)

    setResults(resultData || [])
  }

  // FILTER + SORT
  const processed = useMemo(()=>{

    let data = results.map(r=>{
      const st = students.find(s=>s.id === r.student_id)
      return { ...r, student: st }
    })

    if(search){
      data = data.filter(r =>
        r.student?.name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if(sort==="name"){
      data.sort((a,b)=>a.student?.name.localeCompare(b.student?.name))
    }else if(sort==="high"){
      data.sort((a,b)=>b.percentage - a.percentage)
    }else if(sort==="low"){
      data.sort((a,b)=>a.percentage - b.percentage)
    }else{
      data.sort((a,b)=>a.rank - b.rank)
    }

    return data

  },[results,students,search,sort])

  // KPIs
  const stats = useMemo(()=>{
    if(processed.length === 0) return null

    const total = processed.length
    const avg = processed.reduce((a,b)=>a + b.percentage,0) / total
    const pass = processed.filter(r=>r.percentage >= 33).length

    return {
      total,
      avg: avg.toFixed(1),
      pass: Math.round((pass/total)*100)
    }

  },[processed])

  const topper = processed[0]

  const getColor = (p:number)=>{
    if(p < 33) return "bg-red-500/20 text-red-300"
    if(p <= 60) return "bg-yellow-500/20 text-yellow-300"
    if(p <= 80) return "bg-green-500/20 text-green-300"
    return "bg-blue-500/20 text-blue-300"
  }

  return(

    <div className="p-4 md:p-8 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="sticky top-0 z-10 backdrop-blur bg-[#020617]/80 border-b border-white/10 p-4 flex flex-col md:flex-row justify-between gap-4">

        <div>
          <h1 className="text-2xl font-semibold">Exam Results</h1>
          <p className="text-gray-400 text-sm">Analytics dashboard</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-white/10 rounded">Print</button>
          <button className="px-4 py-2 bg-white/10 rounded">Export CSV</button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded">
            Publish
          </button>
        </div>

      </div>

      {/* CONTROLS */}
      <div className="grid md:grid-cols-4 gap-4">

        <select
          value={selectedExam}
          onChange={(e)=>setSelectedExam(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option value="">Select Exam</option>
          {exams.map(e=>(
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <input
          placeholder="Search student..."
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        />

        <select
          value={sort}
          onChange={(e)=>setSort(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option value="rank">Rank</option>
          <option value="name">Name</option>
          <option value="high">% High → Low</option>
          <option value="low">% Low → High</option>
        </select>

        <button onClick={loadResult} className="bg-white/10 rounded p-3">
          Load Results
        </button>

      </div>

      {/* KPI CARDS */}
      {stats && (
        <div className="grid md:grid-cols-3 gap-4">

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm">Students</p>
            <h2 className="text-2xl font-semibold">{stats.total}</h2>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm">Average %</p>
            <h2 className="text-2xl font-semibold">{stats.avg}</h2>
          </div>

          <div className="bg-white/5 p-4 rounded-xl border border-white/10">
            <p className="text-gray-400 text-sm">Pass Rate</p>
            <h2 className="text-2xl font-semibold">{stats.pass}%</h2>
          </div>

        </div>
      )}

      {/* TOPPER */}
      {topper && (
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/20">
          🏆 Topper: {topper.student?.name} ({topper.percentage.toFixed(1)}%)
        </div>
      )}

      {/* EMPTY */}
      {processed.length === 0 && (
        <div className="text-center text-gray-400 p-20 border border-white/10 rounded-xl">
          No results loaded
        </div>
      )}

      {/* TABLE */}
      {processed.length > 0 && (
        <div className="rounded-xl border border-white/10 overflow-hidden">

          <div className="max-h-[500px] overflow-auto">

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-[#020617] border-b border-white/10">
                <tr>
                  <th className="p-3">Rank</th>
                  <th className="p-3 text-left">Student</th>
                  {subjects.map(s=>(
                    <th key={s.id} className="p-3">{s.name}</th>
                  ))}
                  <th className="p-3">Total</th>
                  <th className="p-3">%</th>
                  <th className="p-3">Grade</th>
                </tr>
              </thead>

              <tbody>

                {processed.map((r,i)=>{

                  const st = r.student

                  return(
                    <tr
                      key={r.id}
                      className={`border-t border-white/5 hover:bg-white/5 ${
                        i===0 ? "bg-yellow-500/10" : ""
                      }`}
                    >

                      <td className="p-3 font-semibold">{i+1}</td>
                      <td className="p-3">{st?.name}</td>

                      {subjects.map(sub=>(
                        <td key={sub.id} className="p-3 text-center">
                          {marksMap[`${st?.id}_${sub.id}`] ?? "-"}
                        </td>
                      ))}

                      <td className="p-3 text-center">{r.total}</td>
                      <td className="p-3 text-center">{r.percentage.toFixed(1)}%</td>
                      <td className="p-3 text-center">{r.grade}</td>

                    </tr>
                  )
                })}

              </tbody>

            </table>

          </div>

        </div>
      )}

    </div>
  )
}