"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type Subject = {
  id: string
  name: string
}

type Exam = {
  id: string
  name: string
  term: string
  date: string
}

export default function CreateExamPage() {

  const schoolId = "1"

  const [name,setName]=useState("")
  const [term,setTerm]=useState("")
  const [date,setDate]=useState("")

  const [scope,setScope]=useState("all")
  const [selectedClass,setSelectedClass]=useState("")

  const [subjects,setSubjects]=useState<Subject[]>([])
  const [selectedSubjects,setSelectedSubjects]=useState<string[]>([])

  const [exams,setExams]=useState<Exam[]>([])

  const classes=["01","02","03","04","05"]

  async function loadSubjects(){

    const {data} = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id",schoolId)

    setSubjects(data || [])
  }

  async function loadExams(){

    const {data} = await supabase
      .from("exams")
      .select("*")
      .eq("school_id",schoolId)
      .order("date",{ascending:false})

    setExams(data || [])

  }

  useEffect(()=>{
    loadSubjects()
    loadExams()
  },[])

  function toggleSubject(id:string){

    if(selectedSubjects.includes(id)){
      setSelectedSubjects(selectedSubjects.filter(s=>s!==id))
    }else{
      setSelectedSubjects([...selectedSubjects,id])
    }

  }

  async function createExam(){

    if(!name || !term || !date){
      alert("Fill exam details")
      return
    }

    const {data:exam} = await supabase
      .from("exams")
      .insert({
        school_id:schoolId,
        name,
        term,
        date
      })
      .select()
      .single()

    if(!exam) return

    for(const subjectId of selectedSubjects){

      await supabase.from("exam_subjects").insert({
        exam_id:exam.id,
        subject_id:subjectId,
        full_marks:100,
        pass_marks:40
      })

    }

    setName("")
    setTerm("")
    setDate("")
    setSelectedSubjects([])

    loadExams()

  }

  async function deleteExam(id:string){

    await supabase.from("exams").delete().eq("id",id)

    loadExams()

  }

  return (

    <div className="p-10 text-white max-w-6xl mx-auto">

      <h1 className="text-2xl font-semibold mb-6">
        Create Exam
      </h1>

      {/* FORM */}

      <div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

        <div className="flex gap-4 flex-wrap mb-4">

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Exam Name"
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <input
            value={term}
            onChange={(e)=>setTerm(e.target.value)}
            placeholder="Term"
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <input
            type="date"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

        </div>

        {/* SCOPE */}

        <div className="flex gap-4 mb-4">

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={scope==="all"}
              onChange={()=>setScope("all")}
            />
            All Classes
          </label>

          <label className="flex items-center gap-2">
            <input
              type="radio"
              checked={scope==="class"}
              onChange={()=>setScope("class")}
            />
            Specific Class
          </label>

        </div>

        {/* CLASS SELECT */}

        {scope==="class" && (

          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded mb-4"
          >

            <option value="">Select Class</option>

            {classes.map(c=>(
              <option key={c}>{c}</option>
            ))}

          </select>

        )}

        {/* SUBJECT SELECT */}

        <div className="mb-4">

          <h3 className="mb-2 font-medium">
            Select Subjects
          </h3>

          <div className="flex flex-wrap gap-3">

            {subjects.map(sub=>{

              const active = selectedSubjects.includes(sub.id)

              return(

                <button
                  key={sub.id}
                  onClick={()=>toggleSubject(sub.id)}
                  className={`px-3 py-1 rounded border ${
                    active
                    ? "bg-blue-600 border-blue-600"
                    : "border-white/30"
                  }`}
                >
                  {sub.name}
                </button>

              )

            })}

          </div>

        </div>

        <button
          onClick={createExam}
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded"
        >
          Save Exam
        </button>

      </div>

      {/* EXAMS TABLE */}

      <div className="overflow-x-auto">

        <table className="min-w-[900px] w-full text-sm">

          <thead>

            <tr className="bg-white/10">

              <th className="p-2 text-left">Exam</th>
              <th className="p-2 text-left">Term</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>

            </tr>

          </thead>

          <tbody>

            {exams.map(exam=>(
              <tr
                key={exam.id}
                className="border-t border-white/10 hover:bg-white/5"
              >

                <td className="p-2">{exam.name}</td>
                <td className="p-2">{exam.term}</td>
                <td className="p-2">{exam.date}</td>

                <td className="p-2">

                  <button
                    onClick={()=>deleteExam(exam.id)}
                    className="bg-red-600 px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )
}