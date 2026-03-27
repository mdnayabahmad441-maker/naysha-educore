"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet } from "@/lib/db"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"

export default function CreateExamPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [examName,setExamName] = useState("")
  const [date,setDate] = useState("")
  const [selectedClass,setSelectedClass] = useState("")
  const [isAllClasses,setIsAllClasses] = useState(true)

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [filteredSubjects,setFilteredSubjects] = useState<any[]>([])

  const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])
  const [marksConfig,setMarksConfig] = useState<any>({})

  const [exams,setExams] = useState<any[]>([])
  const [editingId,setEditingId] = useState<string | null>(null)

  // ================= LOAD =================
  useEffect(()=>{
    load()

    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  const load = async ()=>{
    setClasses(await dbGet("classes"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))
  }

  // ================= FILTER =================
  useEffect(()=>{
    if(isAllClasses){
      setFilteredSubjects(subjects)
    }else{
      setFilteredSubjects(
        subjects.filter(s=>s.class_id === selectedClass)
      )
    }
  },[selectedClass,isAllClasses,subjects])

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

    const examId = editingId || crypto.randomUUID()

    const { error: examError } = await supabase
      .from("exams")
      .upsert({
        id: examId,
        name: examName,
        class_id: isAllClasses ? null : selectedClass,
        is_all_classes: isAllClasses,
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

    load()
  }

  // ================= EDIT =================
  const editExam = async (exam:any)=>{

    setEditingId(exam.id)
    setExamName(exam.name)
    setDate(exam.date)
    setIsAllClasses(exam.is_all_classes)
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
    await supabase.from("exam_subjects").delete().eq("exam_id", id)
    await supabase.from("exams").delete().eq("id", id)
    load()
  }

  // ================= KEYBOARD =================
  const handleKeyDown = (e:any)=>{
    if(e.key === "Enter"){
      e.preventDefault()
      saveExam()
    }
  }

  return(

    <div className="p-6 text-white space-y-6">

      <h1 className="text-2xl">Create Exam</h1>

      <div className="bg-white/5 p-6 rounded-xl space-y-4">

        <input
          value={examName}
          onChange={(e)=>setExamName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Exam Name"
          className="w-full p-3 bg-[#0b1220] rounded"
        />

        <input
          type="date"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-3 bg-[#0b1220] rounded"
        />

        <div className="flex gap-3">
          <button onClick={()=>setIsAllClasses(true)}>All</button>
          <button onClick={()=>setIsAllClasses(false)}>Specific</button>
        </div>

        {!isAllClasses && (
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="p-3 bg-[#0b1220] rounded"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-2 gap-3">

          {filteredSubjects.map(s=>{

            const selected = selectedSubjects.includes(s.id)

            return(
              <div
                key={s.id}
                onClick={()=>toggleSubject(s.id)}
                className={`p-3 cursor-pointer rounded ${
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
                      onChange={(e)=>updateMarks(s.id,e.target.value)}
                      onKeyDown={(e)=>{
                        if(e.key === "Enter"){
                          e.stopPropagation()
                        }
                      }}
                      className="mt-2 w-full p-2 bg-[#0b1220]"
                    />

                    <p className="text-xs text-gray-400 mt-1">
                      Passing: {marksConfig[s.id]?.passing || 0}
                    </p>
                  </>
                )}

              </div>
            )
          })}

        </div>

        <button onClick={saveExam} className="w-full p-3 bg-white/10 rounded">
          {editingId ? "Update Exam" : "Save Exam"}
        </button>

      </div>

      {/* LIST */}
      <div className="bg-white/5 p-6 rounded-xl">

        {exams.map(e=>(
          <div key={e.id} className="flex justify-between border-b py-2">

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