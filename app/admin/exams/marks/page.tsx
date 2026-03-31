"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getUserRole } from "@/lib/getUserRole"

export default function MarksPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [userRole,setUserRole] = useState<string | null>(null)

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
      const roleData = await getUserRole()

      setSchoolId(id)
      setUserRole(roleData?.role || null)
    }
    init()
  },[])

  // LOAD EXAMS + CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("exams").select("*").eq("school_id", schoolId)
      .then(({data})=>setExams(data || []))

    supabase.from("classes").select("*").eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))

  },[schoolId])

  // ================= LOAD DATA =================
  const loadData = async (exam:any, classId?:string)=>{

    let class_id = exam.class_id || classId

    if(exam.is_all_classes && !class_id){
      return
    }

    // ✅ STUDENTS
    const { data:studentsData } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", class_id)

    setStudents(studentsData || [])

    // ✅ SUBJECTS (FIXED)
    const { data:subData, error:subError } = await supabase
      .from("exam_subjects")
      .select(`
        subject_id,
        total_marks,
        subjects(name)
      `)
      .eq("exam_id", exam.id)

    if(subError){
      console.error("Subjects error:", subError)
    }

    const formatted = subData?.map((s:any)=>({
      id: s.subject_id,
      name: s.subjects?.name || "Subject",
      total_marks: s.total_marks
    })) || []

    console.log("Subjects:", formatted)

    setSubjects(formatted)

    // ✅ MARKS (LOAD EXISTING)
    const { data:marksData } = await supabase
      .from("marks")
      .select("*")
      .eq("exam_id", exam.id)

    const map:any = {}

    marksData?.forEach((m:any)=>{
      map[`${m.student_id}_${m.subject_id}`] = m.marks_obtained
    })

    setMarks(map)
  }

  const handleExamChange = (id:string)=>{
    const exam = exams.find(e=>e.id === id)

    setSelectedExam(exam)
    setStudents([])
    setSubjects([])
    setMarks({})
    setSelectedClass("")

    if(exam && !exam.is_all_classes){
      loadData(exam)
    }
  }

  const handleClassChange = (classId:string)=>{
    setSelectedClass(classId)
    loadData(selectedExam, classId)
  }

  // ================= UPDATE =================
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

  // ================= SAVE =================
  const saveMarks = async ()=>{

    if(!selectedExam) return

    const rows:any[] = []

    students.forEach(s=>{
      subjects.forEach(sub=>{

        const key = `${s.id}_${sub.id}`
        const val = Number(marks[key])

        if(val || val === 0){
          rows.push({
            school_id: schoolId,
            exam_id: selectedExam.id,
            student_id: s.id,
            subject_id: sub.id,
            marks_obtained: val
          })
        }

      })
    })

    if(rows.length === 0){
      alert("Enter marks")
      return
    }

    const { error } = await supabase.from("marks").upsert(rows)

    if(error){
      alert(error.message)
      return
    }

    alert("Saved ✅")
  }

  // ================= UI =================
  return(
    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Marks Entry</h1>

      {/* EXAM */}
      <select
        onChange={(e)=>handleExamChange(e.target.value)}
        className="p-3 bg-[#0b1220] rounded"
      >
        <option>Select Exam</option>
        {exams.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
      </select>

      {/* CLASS */}
      {selectedExam?.is_all_classes && (
        <select
          onChange={(e)=>handleClassChange(e.target.value)}
          className="p-3 bg-[#0b1220] rounded"
        >
          <option>Select Class</option>
          {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}

      {/* TABLE */}
      {students.length > 0 && subjects.length > 0 && (
        <div className="overflow-auto">

          <table className="min-w-full border text-sm">

            <thead>
              <tr>
                <th className="p-2 border">Student</th>
                {subjects.map(s=>(
                  <th key={s.id} className="p-2 border">
                    {s.name} ({s.total_marks})
                  </th>
                ))}
                <th>Total</th>
                <th>%</th>
                <th>Grade</th>
              </tr>
            </thead>

            <tbody>

              {students.map(st=>{

                let total = 0
                let max = 0

                return(
                  <tr key={st.id}>
                    <td className="p-2 border">{st.name}</td>

                    {subjects.map(sub=>{
                      const key = `${st.id}_${sub.id}`
                      const val = marks[key] ?? ""
                      const num = Number(val) || 0

                      total += num
                      max += sub.total_marks

                      return(
                        <td key={sub.id} className="p-2 border">
                          <input
                            type="number"
                            value={val}
                            onChange={(e)=>updateMarks(st.id, sub.id, e.target.value)}
                            className="w-20 bg-[#0b1220] p-1"
                          />
                        </td>
                      )
                    })}

                    <td>{total}</td>
                    <td>{max ? ((total/max)*100).toFixed(1) : 0}%</td>
                    <td>{getGrade(max ? (total/max)*100 : 0)}</td>
                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>
      )}

      {/* EMPTY STATE */}
      {selectedExam && subjects.length === 0 && (
        <p className="text-red-400">
          ⚠ No subjects added to this exam
        </p>
      )}

      {/* ACTIONS */}
      {students.length > 0 && (
        <button
          onClick={saveMarks}
          className="px-6 py-3 bg-white/10 rounded"
        >
          Save Marks
        </button>
      )}

    </div>
  )
}