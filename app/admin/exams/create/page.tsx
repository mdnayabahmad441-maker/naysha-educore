"use client"

import { useEffect, useState } from "react"
import { dbGet, dbInsert, dbDelete } from "@/lib/db"

export default function CreateExamPage(){

  const [examName,setExamName] = useState("")
  const [date,setDate] = useState("")

  const [isAllClasses,setIsAllClasses] = useState(true)
  const [selectedClass,setSelectedClass] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [selectedSubjects,setSelectedSubjects] = useState<string[]>([])

  const [marksConfig,setMarksConfig] = useState<any>({})
  const [exams,setExams] = useState<any[]>([])

  // LOAD ALL
  useEffect(()=>{
    load()
  },[])

  const load = async ()=>{
    setClasses(await dbGet("classes"))
    setSubjects(await dbGet("subjects"))
    setExams(await dbGet("exams"))
  }

  // SUBJECT TOGGLE
  const toggleSubject = (id:string)=>{
    setSelectedSubjects(prev =>
      prev.includes(id)
        ? prev.filter(s=>s!==id)
        : [...prev,id]
    )
  }

  const selectAll = ()=> setSelectedSubjects(subjects.map(s=>s.id))
  const clearAll = ()=> setSelectedSubjects([])

  const updateMarks = (subjectId:string,value:any)=>{
    setMarksConfig((prev:any)=>({
      ...prev,
      [subjectId]: value
    }))
  }

  // SAVE EXAM
  const saveExam = async ()=>{

    if(!examName || !date){
      alert("Fill all fields")
      return
    }

    if(!isAllClasses && !selectedClass){
      alert("Select class")
      return
    }

    if(selectedSubjects.length === 0){
      alert("Select subjects")
      return
    }

    const examId = crypto.randomUUID()

    await dbInsert("exams", {
      id: examId,
      name: examName,
      class_id: isAllClasses ? null : selectedClass,
      is_all_classes: isAllClasses,
      date,
      is_published: false
    })

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

    await dbInsert("exam_subjects", rows)

    alert("Exam Created ✅")

    // RESET
    setExamName("")
    setDate("")
    setSelectedSubjects([])
    setMarksConfig({})
    setSelectedClass("")
    setIsAllClasses(true)

    load()
  }

  const deleteExam = async (id:string)=>{
    await dbDelete("exams", id)
    load()
  }

  return(

    <div className="p-6 md:p-10 text-white space-y-6">

      <h1 className="text-2xl font-semibold">Create Exam</h1>

      {/* FORM */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-xl space-y-4">

        {/* NAME */}
        <input
          placeholder="Exam Name"
          value={examName}
          onChange={(e)=>setExamName(e.target.value)}
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        {/* DATE */}
        <input
          type="date"
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        {/* CLASS TYPE */}
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

        {/* CLASS SELECT */}
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

        {/* SUBJECT ACTIONS */}
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

          {subjects.map(s=>{

            const selected = selectedSubjects.includes(s.id)

            return(
              <div
                key={s.id}
                onClick={()=>toggleSubject(s.id)}
                className={`p-3 rounded border cursor-pointer ${
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

      {/* EXAMS LIST */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-xl">

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