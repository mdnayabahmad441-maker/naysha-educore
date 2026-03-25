"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getUserRole } from "@/lib/getUserRole" // ✅ ADDED

export default function MarksPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [userRole,setUserRole] = useState("") // ✅ ADDED

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
      const roleData = await getUserRole() // ✅ ADDED

      setSchoolId(id)
      setUserRole(roleData?.role || "")
    }
    init()
  },[])

  // LOAD EXAMS
  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setExams(data || []))
  },[schoolId])

  // LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // LOAD DATA
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

    // SUBJECTS FROM EXAM
    const { data:subjectData } = await supabase
      .from("exam_subjects")
      .select("subjects(*)")
      .eq("exam_id", exam.id)

    const formatted = subjectData?.map((s:any)=>s.subjects) || []
    setSubjects(formatted)
  }

  const handleExamChange = (id:string)=>{
    const exam = exams.find(e=>e.id === id)

    setSelectedExam(exam)
    setStudents([])
    setSubjects([])
    setSelectedClass("")

    if(!exam?.is_all_classes){
      loadData(exam)
    }
  }

  const handleClassChange = (classId:string)=>{
    setSelectedClass(classId)
    loadData(selectedExam, classId)
  }

  const updateMarks = (studentId:string, subjectId:string, value:any)=>{
    setMarks((prev:any)=>({
      ...prev,
      [`${studentId}_${subjectId}`]: value
    }))
  }

  const getGrade = (p:number)=>{
    if(p>=90) return "A+"
    if(p>=75) return "A"
    if(p>=60) return "B"
    if(p>=50) return "C"
    if(p>=33) return "D"
    return "F"
  }

  // SAVE
  const saveMarks = async ()=>{

    if(!selectedExam) return

    const rows = []

    for(let s of students){
      for(let sub of subjects){

        const key = `${s.id}_${sub.id}`
        const val = marks[key]

        if(val !== undefined){

          rows.push({
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
      alert("Enter marks")
      return
    }

    await supabase.from("marks").upsert(rows)

    alert("Marks saved ✅")
  }

  // PUBLISH (ADMIN ONLY)
  const publishResult = async ()=>{

    if(userRole === "teacher"){
      alert("You are not allowed to publish results")
      return
    }

    if(!selectedExam) return

    const { data } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", selectedExam.id)
      .eq("school_id", schoolId)

    if(!data) return

    const grouped:any = {}

    data.forEach((m:any)=>{
      if(!grouped[m.student_id]){
        grouped[m.student_id] = { total:0, subjects:0, fail:false }
      }

      grouped[m.student_id].total += m.marks_obtained
      grouped[m.student_id].subjects += 1

      if(m.marks_obtained < 33){
        grouped[m.student_id].fail = true
      }
    })

    let results = Object.entries(grouped).map(([student_id,val]:any)=>{

      const percentage = (val.total/(val.subjects*100))*100

      return {
        id: crypto.randomUUID(),
        school_id: schoolId,
        exam_id: selectedExam.id,
        student_id,
        total: val.total,
        percentage,
        status: val.fail ? "FAIL":"PASS",
        grade: getGrade(percentage)
      }
    })

    results.sort((a:any,b:any)=>b.total - a.total)

    results = results.map((r:any,i:number)=>({
      ...r,
      rank: i+1
    }))

    await supabase.from("results").upsert(results)

    await supabase
      .from("exams")
      .update({ is_published: true })
      .eq("id", selectedExam.id)

    alert("Result Published 🚀")
  }

  return(
    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Marks Entry</h1>

      <select onChange={(e)=>handleExamChange(e.target.value)} className="p-3 bg-[#0b1220] rounded">
        <option>Select Exam</option>
        {exams.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      {selectedExam?.is_all_classes && (
        <select onChange={(e)=>handleClassChange(e.target.value)} className="p-3 bg-[#0b1220] rounded">
          <option>Select Class</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {students.length > 0 && (

        <div className="overflow-auto">

          <table className="min-w-full border">

            <thead>
              <tr>
                <th>Student</th>
                {subjects.map(s=><th key={s.id}>{s.name}</th>)}
                <th>Total</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>

            <tbody>

              {students.map(st=>{

                let total = 0

                return(
                  <tr key={st.id}>
                    <td>{st.name}</td>

                    {subjects.map(sub=>{
                      const key = `${st.id}_${sub.id}`
                      const val = marks[key] || ""
                      const num = Number(val) || 0
                      total += num

                      return(
                        <td key={sub.id}>
                          <input
                            type="number"
                            value={val}
                            onChange={(e)=>updateMarks(st.id, sub.id, e.target.value)}
                            className="w-20 bg-[#0b1220]"
                          />
                        </td>
                      )
                    })}

                    <td>{total}</td>
                    <td>{((total/(subjects.length*100))*100).toFixed(1)}%</td>
                    <td>{getGrade((total/(subjects.length*100))*100)}</td>
                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>
      )}

      {students.length > 0 && (
        <div className="flex gap-4">
          <button onClick={saveMarks} className="px-6 py-3 bg-white/10 rounded">
            Save
          </button>

          {/* 🔥 HIDE FOR TEACHER */}
          {userRole !== "teacher" && (
            <button onClick={publishResult} className="px-6 py-3 bg-white/10 rounded">
              Publish
            </button>
          )}

        </div>
      )}

    </div>
  )
}