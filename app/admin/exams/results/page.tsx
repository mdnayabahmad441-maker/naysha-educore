"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type ResultRow = {
  student: string
  class: string
  marks: Record<string, number | string>
  total: number
  percentage: number
  rank: number
  grade: string
}

export default function ResultsPage() {

  const [exams,setExams] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [results,setResults] = useState<ResultRow[]>([])

  const [selectedExam,setSelectedExam] = useState("")
  const [selectedClass,setSelectedClass] = useState("")

  useEffect(()=>{
    loadExams()
  },[])

  async function loadExams(){

    const {data} = await supabase
      .from("exams")
      .select("*")

    setExams(data || [])
  }

  function getGrade(p:number){

    if(p >= 90) return "A+"
    if(p >= 80) return "A"
    if(p >= 60) return "B"
    if(p >= 40) return "C"
    return "F"
  }

  function getRowColor(r:ResultRow){

    if(r.rank === 1) return "bg-yellow-400 text-black"
    if(r.rank === 2) return "bg-gray-300 text-black"
    if(r.rank === 3) return "bg-orange-300 text-black"

    if(r.percentage < 33) return "bg-red-500"
    if(r.percentage < 60) return "bg-yellow-400 text-black"
    if(r.percentage < 80) return "bg-green-300 text-black"

    return "bg-green-600"
  }

  async function loadResults(){

    if(!selectedExam || !selectedClass){
      alert("Select exam and class")
      return
    }

    /* SUBJECTS */

    const {data:subjectData} = await supabase
      .from("exam_subjects")
      .select(`
        subject_id,
        full_marks,
        subjects(name)
      `)
      .eq("exam_id",selectedExam)

    const subjectsList = subjectData || []

    setSubjects(subjectsList)

    /* STUDENTS */

    const {data:students} = await supabase
      .from("students")
      .select("*")
      .eq("class",selectedClass)

    let rows:ResultRow[] = []

    for(const student of (students || []) as any[]){

      let total = 0
      let subjectMarks:Record<string,number|string> = {}

      for(const subject of subjectsList){

const subjectName = subject?.subjects?.[0]?.name || "Subject"

        const {data:markRow} = await supabase
          .from("marks")
          .select("marks")
          .eq("exam_id",selectedExam)
          .eq("student_id",student.id)
          .eq("subject_id",subject.subject_id)
          .maybeSingle()

        let mark:any = markRow?.marks

        if(mark === null || mark === undefined || mark === ""){
          mark = "ABSENT"
        }else{
          mark = Number(mark)

          if(!isNaN(mark)){
            total += mark
          }
        }

        subjectMarks[subjectName] = mark
      }

      const maxTotal = subjectsList.reduce(
        (sum:number,s:any)=> sum + Number(s.full_marks || 0),
        0
      )

      let percentage = 0

      if(maxTotal > 0){
        percentage = (total / maxTotal) * 100
      }

      if(isNaN(percentage)){
        percentage = 0
      }

      rows.push({
        student:student.name,
        class:student.class,
        marks:subjectMarks,
        total,
        percentage,
        rank:0,
        grade:""
      })
    }

    rows.sort((a,b)=> b.total - a.total)

    rows = rows.map((r,i)=>({
      ...r,
      rank:i+1,
      grade:getGrade(r.percentage)
    }))

    setResults(rows)
  }

  return(

    <div className="p-10 text-white">

      <h1 className="text-4xl font-bold mb-8">
        Exam Results
      </h1>

      <div className="flex gap-4 mb-6 flex-wrap">

        <select
          className="bg-slate-800 p-2 rounded"
          onChange={(e)=>setSelectedExam(e.target.value)}
        >
          <option>Select Exam</option>

          {exams.map((exam)=>(
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>

        <select
          className="bg-slate-800 p-2 rounded"
          onChange={(e)=>setSelectedClass(e.target.value)}
        >
          <option>Select Class</option>
          <option value="01">01</option>
          <option value="02">02</option>
          <option value="03">03</option>
        </select>

        <button
          onClick={loadResults}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Load Results
        </button>

      </div>

      <div className="overflow-x-auto">

        <table className="min-w-full text-sm">

          <thead>

            <tr className="bg-gray-700">

              <th className="p-2">Rank</th>
              <th className="p-2">Student</th>
              <th className="p-2">Class</th>

              {subjects.map((s:any)=>{

                const name = s?.subjects?.name || "Subject"

                return(
                  <th key={s.subject_id} className="p-2">
                    {name}
                  </th>
                )
              })}

              <th className="p-2">Total</th>
              <th className="p-2">%</th>
              <th className="p-2">Grade</th>

            </tr>

          </thead>

          <tbody>

            {results.map((r)=>{

              const color = getRowColor(r)

              let medal = ""
              if(r.rank === 1) medal="🥇"
              if(r.rank === 2) medal="🥈"
              if(r.rank === 3) medal="🥉"

              return(

                <tr key={r.student} className={color}>

                  <td className="p-2">{medal} {r.rank}</td>
                  <td className="p-2">{r.student}</td>
                  <td className="p-2">{r.class}</td>

                  {subjects.map((s:any)=>{

                    const name = s?.subjects?.name || "Subject"

                    return(
                      <td key={s.subject_id} className="p-2">
                        {r.marks[name]}
                      </td>
                    )
                  })}

                  <td className="p-2">{r.total}</td>
                  <td className="p-2">{r.percentage.toFixed(2)}%</td>
                  <td className="p-2">{r.grade}</td>

                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

    </div>
  )
}