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
  exam_date: string
  class: string
}

export default function CreateExamPage() {

  const schoolId = "1"

  const [name,setName] = useState("")
  const [date,setDate] = useState("")
  const [scope,setScope] = useState("ALL")
  const [selectedClass,setSelectedClass] = useState("")

  const [subjects,setSubjects] = useState<Subject[]>([])
  const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])

  const [exams,setExams] = useState<Exam[]>([])

 const classes = ["Nursery","LKG","UKG","Class 1","Class 2","Class 3","Class 4","Class 5","Class 6","Class 7","Class 8","Class 9","Class 10"]

  useEffect(()=>{
    loadSubjects()
    loadExams()
  },[])

  async function loadSubjects(){

    const { data } = await supabase
      .from("subjects")
      .select("*")
      .eq("school_id",schoolId)
      .order("name")

    setSubjects(data || [])
  }

  async function loadExams(){

    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id",schoolId)
      .order("exam_date",{ascending:false})

    setExams(data || [])

  }

  function toggleSubject(id:string){

    if(selectedSubjects.includes(id)){
      setSelectedSubjects(selectedSubjects.filter(s=>s!==id))
    }else{
      setSelectedSubjects([...selectedSubjects,id])
    }

  }

  async function createExam(){

    if(!name || !date){
      alert("Enter exam name and date")
      return
    }

    const examClass = scope === "ALL" ? "ALL" : selectedClass

    const { data, error } = await supabase
      .from("exams")
      .insert({
        school_id: schoolId,
        name: name,
        exam_date: date,
        class: examClass
      })
      .select()
      .single()

    if(error){
      console.error(error)
      alert(error.message)
      return
    }

    const examId = data.id

    for(const subjectId of selectedSubjects){

      await supabase
        .from("exam_subjects")
        .insert({
          exam_id: examId,
          subject_id: subjectId,
          full_marks: 100,
          pass_marks: 40
        })

    }

    setName("")
    setDate("")
    setSelectedSubjects([])
    setSelectedClass("")
    setScope("ALL")

    loadExams()

  }

  async function deleteExam(id:string){

    await supabase
      .from("exams")
      .delete()
      .eq("id",id)

    loadExams()

  }

  return (

    <div className="p-10 text-white max-w-6xl mx-auto">

      <h1 className="text-2xl font-semibold mb-6">
        Create Exam
      </h1>

      {/* FORM CARD */}

      <div className="bg-white/10 border border-white/20 rounded-xl backdrop-blur p-6 mb-8">

        <div className="flex gap-4 flex-wrap mb-4">

          <input
            value={name}
            onChange={(e)=>setName(e.target.value)}
            placeholder="Exam Name"
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

          <input
            type="date"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded"
          />

        </div>

        {/* EXAM TYPE */}

        <div className="flex gap-6 mb-4">

          <label className="flex gap-2 items-center">

            <input
              type="radio"
              checked={scope==="ALL"}
              onChange={()=>setScope("ALL")}
            />

            All Classes

          </label>

          <label className="flex gap-2 items-center">

            <input
              type="radio"
              checked={scope==="CLASS"}
              onChange={()=>setScope("CLASS")}
            />

            Specific Class

          </label>

        </div>

        {/* CLASS SELECT */}

        {scope==="CLASS" && (

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

          <div className="flex flex-wrap gap-2">

            {subjects.map(sub=>{

              const active = selectedSubjects.includes(sub.id)

              return(

                <button
                  key={sub.id}
                  onClick={()=>toggleSubject(sub.id)}
                  className={`px-3 py-1 rounded border text-sm ${
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
          className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded font-medium"
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
              <th className="p-2 text-left">Class</th>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Action</th>

            </tr>

          </thead>

          <tbody>

            {exams.length === 0 && (

              <tr>
                <td colSpan={4} className="p-4 text-gray-400">
                  No exams created yet
                </td>
              </tr>

            )}

            {exams.map(exam=>(
              <tr
                key={exam.id}
                className="border-t border-white/10 hover:bg-white/5"
              >

                <td className="p-2">{exam.name}</td>
                <td className="p-2">{exam.class}</td>
                <td className="p-2">{exam.exam_date}</td>

                <td className="p-2">

                  <button
                    onClick={()=>deleteExam(exam.id)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
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