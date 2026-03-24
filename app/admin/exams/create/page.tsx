"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function CreateExamPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [examName,setExamName] = useState("")
  const [date,setDate] = useState("")

  const [isAllClasses,setIsAllClasses] = useState(true)
  const [selectedClass,setSelectedClass] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])

  const [marksConfig,setMarksConfig] = useState<any>({})
  const [exams,setExams] = useState<any[]>([])

  // ================= INIT =================
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ================= LOAD CLASSES =================
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

  // ================= LOAD SUBJECTS (FIXED) =================
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      // Try with school_id
      let { data } = await supabase
        .from("subjects")
        .select("*")
        .eq("school_id", schoolId)

      // Fallback (VERY IMPORTANT)
      if(!data || data.length === 0){
        const res = await supabase
          .from("subjects")
          .select("*")

        data = res.data
      }

      console.log("Subjects:", data)

      setSubjects(data || [])
    }

    load()
  },[schoolId])

  // ================= LOAD EXAMS =================
  useEffect(()=>{
    if(!schoolId) return
    loadExams()
  },[schoolId])

  const loadExams = async ()=>{
    const { data } = await supabase
      .from("exams")
      .select("*")
      .eq("school_id", schoolId)

    setExams(data || [])
  }

  // ================= SUBJECT SELECT =================
  const toggleSubject = (id:string)=>{
    setSelectedSubjects(prev =>
      prev.includes(id)
        ? prev.filter(s=>s!==id)
        : [...prev,id]
    )
  }

  const selectAll = ()=>{
    setSelectedSubjects(subjects.map(s=>s.id))
  }

  const clearAll = ()=>{
    setSelectedSubjects([])
  }

  const updateMarks = (subjectId:string,value:any)=>{
    setMarksConfig((prev:any)=>({
      ...prev,
      [subjectId]: value
    }))
  }

  // ================= SAVE EXAM =================
  const saveExam = async ()=>{

    if(!examName || !date){
      alert("Fill all fields")
      return
    }

    if(selectedSubjects.length === 0){
      alert("Select at least one subject")
      return
    }

    const examId = crypto.randomUUID()

    await supabase.from("exams").insert([
      {
        id: examId,
        school_id: schoolId,
        name: examName,
        class_id: isAllClasses ? null : selectedClass,
        is_all_classes: isAllClasses,
        date
      }
    ])

    const rows = selectedSubjects.map(sub=>{

      const total = Number(marksConfig[sub] || 100)

      return {
        id: crypto.randomUUID(),
        exam_id: examId,
        subject_id: sub,
        total_marks: total,
        passing_marks: Math.ceil(total * 0.33)
      }
    })

    await supabase.from("exam_subjects").insert(rows)

    alert("Exam Created ✅")

    setExamName("")
    setDate("")
    setSelectedSubjects([])
    setMarksConfig({})

    loadExams()
  }

  // ================= DELETE =================
  const deleteExam = async (id:string)=>{
    await supabase.from("exams").delete().eq("id", id)
    loadExams()
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Create Exam</h1>

      {/* FORM */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl space-y-4">

        <input
          placeholder="Exam Name"
          value={examName}
          onChange={(e)=>setExamName(e.target.value)}
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          type="date"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        {/* CLASS */}
        <div className="flex gap-3">

          <button
            onClick={()=>setIsAllClasses(true)}
            className={`px-4 py-2 rounded ${
              isAllClasses ? "bg-white/20" : "bg-white/5"
            }`}
          >
            All Classes
          </button>

          <button
            onClick={()=>setIsAllClasses(false)}
            className={`px-4 py-2 rounded ${
              !isAllClasses ? "bg-white/20" : "bg-white/5"
            }`}
          >
            Specific Class
          </button>

        </div>

        {!isAllClasses && (
          <select
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="p-3 bg-[#0b1220] rounded"
          >
            <option>Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {/* SUBJECT CONTROLS */}
        <div className="flex gap-3">
          <button onClick={selectAll} className="px-3 py-2 bg-white/10 rounded">
            Select All
          </button>
          <button onClick={clearAll} className="px-3 py-2 bg-white/10 rounded">
            Clear
          </button>
        </div>

        {/* SUBJECT GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">

          {subjects.length === 0 && (
            <p className="text-gray-400">No subjects found</p>
          )}

          {subjects.map(s=>{

            const selected = selectedSubjects.includes(s.id)

            return(
              <div
                key={s.id}
                onClick={()=>toggleSubject(s.id)}
                className={`p-3 rounded cursor-pointer border ${
                  selected
                    ? "bg-white/20 border-white/30"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex justify-between">
                  <p>{s.name}</p>
                  {selected && <span>✔</span>}
                </div>

                {selected && (
                  <>
                    <input
                      type="number"
                      placeholder="Total Marks"
                      onClick={(e)=>e.stopPropagation()}
                      onChange={(e)=>updateMarks(s.id,e.target.value)}
                      className="mt-2 w-full p-2 bg-[#0b1220] rounded"
                    />

                    <p className="text-xs text-gray-400 mt-1">
                      Passing: {Math.ceil((marksConfig[s.id] || 100) * 0.33)}
                    </p>
                  </>
                )}
              </div>
            )
          })}

        </div>

        <button
          onClick={saveExam}
          className="w-full p-3 bg-white/10 rounded"
        >
          Save Exam
        </button>

      </div>

      {/* LIST */}
      <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-6 rounded-xl">

        <h2 className="mb-4">Created Exams</h2>

        {exams.map(e=>(
          <div key={e.id} className="flex justify-between border-b border-white/10 py-2">

            <div>
              <p>{e.name}</p>
              <p className="text-sm text-gray-400">{e.date}</p>
            </div>

            <button
              onClick={()=>deleteExam(e.id)}
              className="px-3 py-1 bg-white/10 rounded"
            >
              Delete
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}