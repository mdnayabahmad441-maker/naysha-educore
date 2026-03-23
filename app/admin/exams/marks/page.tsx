"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function MarksPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [exams,setExams] = useState<any[]>([])
  const [selectedExam,setSelectedExam] = useState<any>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [selectedClass,setSelectedClass] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])

  const [marks,setMarks] = useState<any>({})

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD EXAMS
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("school_id", schoolId)

      setExams(data || [])
    }

    load()
  },[schoolId])

  // LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      setClasses(data || [])
    }

    load()
  },[schoolId])

  // LOAD DATA AFTER EXAM SELECT
  const loadData = async (exam:any, classId?:string)=>{

    let class_id = exam.class_id

    if(exam.is_all_classes){
      class_id = classId
    }

    if(!class_id) return

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
  }

  // HANDLE EXAM CHANGE
  const handleExamChange = async (id:string)=>{
    const exam = exams.find(e=>e.id === id)
    setSelectedExam(exam)
    setStudents([])
    setSubjects([])
    setSelectedClass("")

    if(!exam.is_all_classes){
      loadData(exam)
    }
  }

  // HANDLE CLASS CHANGE (FOR ALL CLASSES)
  const handleClassChange = async (classId:string)=>{
    setSelectedClass(classId)
    loadData(selectedExam, classId)
  }

  // HANDLE MARK INPUT
  const updateMarks = (studentId:string, subjectId:string, value:any)=>{

    setMarks((prev:any)=>({
      ...prev,
      [`${studentId}_${subjectId}`]: value
    }))
  }

  // SAVE MARKS
  const saveMarks = async ()=>{

    if(!selectedExam) return

    const rows = []

    for(let s of students){
      for(let sub of subjects){

        const key = `${s.id}_${sub.id}`
        const val = marks[key]

        if(val !== undefined){

          rows.push({
            id: crypto.randomUUID(),
            school_id: schoolId,
            exam_id: selectedExam.id,
            student_id: s.id,
            subject_id: sub.id,
            marks_obtained: Number(val)
          })
        }
      }
    }

    if(rows.length === 0){
      alert("Enter marks first")
      return
    }

    await supabase.from("marks").insert(rows)

    alert("Marks saved ✅")
  }

  // PUBLISH RESULT
  const publishResult = async ()=>{

    if(!selectedExam) return

    await supabase.from("results").upsert([
      {
        id: selectedExam.id,
        exam_id: selectedExam.id,
        is_published: true
      }
    ])

    alert("Result Published 🚀")
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Marks Entry</h1>

      {/* SELECT EXAM */}
      <select
        onChange={(e)=>handleExamChange(e.target.value)}
        className="p-3 bg-[#0b1220] rounded-xl"
      >
        <option>Select Exam</option>
        {exams.map(e=>(
          <option key={e.id} value={e.id}>{e.name}</option>
        ))}
      </select>

      {/* CLASS SELECT (IF ALL) */}
      {selectedExam?.is_all_classes && (
        <select
          onChange={(e)=>handleClassChange(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl"
        >
          <option>Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}

      {/* GRID */}
      {students.length > 0 && subjects.length > 0 && (

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

              </tr>
            </thead>

            <tbody>

              {students.map(st=>(
                <tr key={st.id}>

                  <td className="border p-2">{st.name}</td>

                  {subjects.map(sub=>{

                    const key = `${st.id}_${sub.id}`

                    return(
                      <td key={sub.id} className="border p-1">

                        <input
                          type="number"
                          value={marks[key] || ""}
                          onChange={(e)=>updateMarks(st.id, sub.id, e.target.value)}
                          className="w-20 p-1 bg-[#0b1220] text-white rounded"
                        />

                      </td>
                    )
                  })}

                </tr>
              ))}

            </tbody>

          </table>

        </div>
      )}

      {/* BUTTONS */}
      {students.length > 0 && (
        <div className="flex gap-4">

          <button
            onClick={saveMarks}
            className="px-6 py-3 bg-green-600 rounded-xl"
          >
            Save Marks
          </button>

          <button
            onClick={publishResult}
            className="px-6 py-3 bg-blue-600 rounded-xl"
          >
            Publish Result
          </button>

        </div>
      )}

    </div>
  )
}