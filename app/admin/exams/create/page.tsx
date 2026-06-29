"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
import { getUserRole } from "@/lib/getUserRole"
import { getCurrentTeacherClassIds } from "@/lib/role-access"

export default function CreateExamPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [examName,setExamName] = useState("")
  const [date,setDate] = useState("")
  const [selectedClass,setSelectedClass] = useState("")
  const [isAllClasses,setIsAllClasses] = useState(true)

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [filteredSubjects,setFilteredSubjects] = useState<any[]>([])
  const [role,setRole] = useState<string | null>(null)
  const [allowedClassIds,setAllowedClassIds] = useState<string[]>([])

  const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])
  const [marksConfig,setMarksConfig] = useState<any>({})

  const [exams,setExams] = useState<any[]>([])
  const [editingId,setEditingId] = useState<string | null>(null)

  async function load(){
    const roleData = await getUserRole()
    const teacherClassIds = roleData?.role === "teacher"
      ? await getCurrentTeacherClassIds()
      : []
    const allClasses = await dbGet("classes")
    const allExams = await dbGet("exams")

    setRole(roleData?.role || null)
    setAllowedClassIds(teacherClassIds)
    setClasses(
      roleData?.role === "teacher"
        ? allClasses.filter((schoolClass:any)=>teacherClassIds.includes(schoolClass.id))
        : allClasses
    )
    setSubjects(await dbGet("subjects"))
    setExams(
      (roleData?.role === "teacher"
        ? allExams.filter((exam:any)=>teacherClassIds.includes(exam.class_id))
        : allExams
      ).sort((a:any, b:any) => String(b.date || "").localeCompare(String(a.date || "")))
    )
  }

  // ================= LOAD =================
  useEffect(()=>{
    load()

    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ================= FILTER =================
  useEffect(()=>{
    if(isAllClasses){
      setFilteredSubjects(
        role === "teacher"
          ? subjects.filter((subject)=>allowedClassIds.includes(subject.class_id))
          : subjects
      )
    }else{
      setFilteredSubjects(
        subjects.filter(s=>s.class_id === selectedClass)
      )
    }
  },[selectedClass,isAllClasses,subjects,role,allowedClassIds])

  useEffect(()=>{
    if(role !== "teacher") return

    setIsAllClasses(false)

    if(!selectedClass && classes.length === 1){
      setSelectedClass(classes[0].id)
    }
  },[role, classes, selectedClass])

  // ================= SELECT =================
  const toggleSubject = (id:string)=>{
    setSelectedSubjects(prev =>
      prev.includes(id)
        ? prev.filter(s=>s!==id)
        : [...prev,id]
    )
  }

  // ================= MARKS =================
  const updateMarks = (id:string,val:any)=>{
    const total = Number(val)

    setMarksConfig((prev:any)=>({
      ...prev,
      [id]: {
        total,
        passing: Math.ceil(total * 0.33)
      }
    }))
  }

  // ================= DATE VALIDATION =================
  const isPastDate = (examDate:string)=>{
    const today = new Date()
    today.setHours(0,0,0,0)

    const selected = new Date(examDate)
    selected.setHours(0,0,0,0)

    return selected < today
  }

  // ================= SAVE =================
  const saveExam = async ()=>{

    if(!examName || !date){
      alert("Fill all fields")
      return
    }

    if(!schoolId){
      alert("School not loaded")
      return
    }

    if(role === "teacher"){
      if(isAllClasses){
        alert("Teachers can create exams only for their assigned class")
        return
      }

      if(!allowedClassIds.includes(selectedClass)){
        alert("You can create exams only for your assigned class")
        return
      }
    }

    if(!isAllClasses && !selectedClass){
      alert("Select class")
      return
    }

    if(selectedSubjects.length === 0){
      alert("Select at least one subject")
      return
    }

    // ❌ BLOCK PAST CREATION
    if(isPastDate(date) && !editingId){
      alert("❌ Cannot create exam in past date")
      return
    }

    // ❌ BLOCK EDIT PAST
    if(editingId){
      const oldExam = exams.find(e=>e.id === editingId)

      if(oldExam && isPastDate(oldExam.date)){
        alert("❌ Cannot edit past exam")
        return
      }
    }

    const examId = editingId || crypto.randomUUID()

    const { error: examError } = await supabase
      .from("exams")
      .upsert({
        id: examId,
        name: examName,
        class_id: role === "teacher" ? selectedClass : (isAllClasses ? null : selectedClass),
        is_all_classes: role === "teacher" ? false : isAllClasses,
        date,
        is_published: false,
        school_id: schoolId
      })

    if(examError){
      alert(examError.message)
      return
    }

    if(editingId){
      await supabase
        .from("exam_subjects")
        .delete()
        .eq("exam_id", examId)
    }

    const rows = selectedSubjects.map(s=>({
      id: crypto.randomUUID(),
      exam_id: examId,
      subject_id: s,
      total_marks: marksConfig[s]?.total || 100,
      passing_marks: marksConfig[s]?.passing || 33,
      school_id: schoolId
    }))

    const { error: subError } = await supabase
      .from("exam_subjects")
      .insert(rows)

    if(subError){
      alert(subError.message)
      return
    }

    alert(editingId ? "Updated ✅" : "Created ✅")

    setExamName("")
    setDate("")
    setSelectedSubjects([])
    setMarksConfig({})
    setEditingId(null)
    setIsAllClasses(role === "teacher" ? false : isAllClasses)

    load()
  }

  // ================= EDIT =================
  const editExam = async (exam:any)=>{

    // ❌ BLOCK EDIT IF PAST
    if(isPastDate(exam.date)){
      alert("❌ Cannot edit past exam")
      return
    }

    setEditingId(exam.id)
    setExamName(exam.name)
    setDate(exam.date)
    setIsAllClasses(role === "teacher" ? false : exam.is_all_classes)
    setSelectedClass(exam.class_id || "")

    const { data } = await supabase
      .from("exam_subjects")
      .select("*")
      .eq("exam_id", exam.id)

    if(data){
      setSelectedSubjects(data.map(d=>d.subject_id))

      const config:any = {}
      data.forEach(d=>{
        config[d.subject_id] = {
          total: d.total_marks,
          passing: d.passing_marks
        }
      })

      setMarksConfig(config)
    }
  }

  // ================= DELETE =================
  const deleteExam = async (id:string)=>{

    const exam = exams.find(e=>e.id === id)

    // ❌ BLOCK DELETE IF PAST
    if(exam && isPastDate(exam.date)){
      alert("❌ Cannot delete past exam")
      return
    }

    await supabase.from("exam_subjects").delete().eq("exam_id", id)
    await supabase.from("exams").delete().eq("id", id)

    load()
  }

  return(

    <div className="space-y-6 p-4 pb-28 text-white md:p-6 md:pb-6">

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Create Exam</h1>
        <p className="text-sm text-slate-400">
          Build class exams with simpler mobile controls and subject cards.
        </p>
      </div>

      <div className="space-y-4 rounded-[28px] bg-white/5 p-4 shadow-[0_20px_60px_rgba(2,8,23,0.22)] md:p-6">

        <input
          value={examName}
          onChange={(e)=>setExamName(e.target.value)}
          placeholder="Exam Name"
          className="w-full rounded-2xl bg-[#0b1220] p-3"
        />

        <input
          type="date"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          className="w-full rounded-2xl bg-[#0b1220] p-3"
        />

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#0b1220] p-2">
          {role !== "teacher" && (
            <button
              onClick={()=>setIsAllClasses(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${isAllClasses ? "bg-white/15 text-white" : "text-slate-400"}`}
            >
              All
            </button>
          )}
          <button
            onClick={()=>setIsAllClasses(false)}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${!isAllClasses ? "bg-white/15 text-white" : "text-slate-400"}`}
          >
            Specific
          </button>
        </div>

        {(role === "teacher" || !isAllClasses) && (
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="w-full rounded-2xl bg-[#0b1220] p-3"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {role === "teacher" && classes.length === 0 && (
          <p className="text-sm text-yellow-300">
            No class is assigned to you as class teacher.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

          {filteredSubjects.map(s=>{

            const selected = selectedSubjects.includes(s.id)

            return(
              <div
                key={s.id}
                onClick={()=>toggleSubject(s.id)}
                className={`cursor-pointer rounded-2xl p-4 ${
                  selected ? "bg-white/20" : "bg-white/5"
                }`}
              >
                <p>{s.name}</p>

                {selected && (
                  <>
                    <input
                      type="number"
                      placeholder="Total Marks"
                      value={marksConfig[s.id]?.total || ""}
                      onClick={(e)=>e.stopPropagation()}
                      onChange={(e)=>updateMarks(s.id,e.target.value)}
                      className="mt-3 w-full rounded-xl bg-[#0b1220] p-2.5"
                    />

                    <p
                      onClick={(e)=>e.stopPropagation()}
                      className="text-xs text-gray-400 mt-1"
                    >
                      Passing: {marksConfig[s.id]?.passing || 0}
                    </p>
                  </>
                )}

              </div>
            )
          })}

        </div>

        <div className="sticky bottom-20 z-20 -mx-1 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,26,51,0.9))] p-3 shadow-[0_24px_70px_rgba(2,8,23,0.38)] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <button onClick={saveExam} className="w-full rounded-2xl bg-white/10 p-3 font-semibold">
            {editingId ? "Update Exam" : "Save Exam"}
          </button>
        </div>

      </div>

      <div className="rounded-[28px] bg-white/5 p-4 md:p-6">

        {exams.map(e=>(
          <div key={e.id} className="flex flex-col gap-3 border-b border-white/10 py-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p>{e.name}</p>
              <p className="text-sm text-gray-400">{e.date}</p>
            </div>

            <div className="flex gap-2">

              <button
                onClick={()=>editExam(e)}
                className="px-3 py-1 bg-blue-500/20 rounded"
              >
                Edit
              </button>

              <button
                onClick={()=>deleteExam(e.id)}
                className="px-3 py-1 bg-red-500/20 rounded"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}
