"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ExamsPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [exams,setExams] = useState<any[]>([])

  const [name,setName] = useState("")
  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSubject,setSelectedSubject] = useState("")
  const [examDate,setExamDate] = useState("")
  const [isAllClasses,setIsAllClasses] = useState(false)

  const [editingId,setEditingId] = useState<string | null>(null)

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
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      if(error) console.error(error)

      setClasses(data || [])
    }

    load()
  },[schoolId])

  // ================= LOAD SUBJECTS =================
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("school_id", schoolId)

      if(error) console.error(error)

      setSubjects(data || [])
    }

    load()
  },[schoolId])

  // ================= LOAD EXAMS =================
  const loadExams = async ()=>{
    if(!schoolId) return

    const { data, error } = await supabase
      .from("exams")
      .select(`
        *,
        classes(name),
        subjects(name)
      `)
      .eq("school_id", schoolId)
      .order("created_at",{ascending:false})

    if(error){
      console.error(error)
      return
    }

    setExams(data || [])
  }

  useEffect(()=>{
    loadExams()
  },[schoolId])

  // ================= SAVE =================
  const saveExam = async ()=>{

    if(!name || !examDate){
      alert("Fill all required fields")
      return
    }

    if(!isAllClasses && !selectedClass){
      alert("Select class")
      return
    }

    if(!selectedSubject){
      alert("Select subject")
      return
    }

    const payload = {
      name,
      school_id: schoolId,
      class_id: isAllClasses ? null : selectedClass,
      subject_id: selectedSubject,
      exam_date: examDate,
      is_all_classes: isAllClasses
    }

    let error

    if(editingId){

      const res = await supabase
        .from("exams")
        .update(payload)
        .eq("id", editingId)

      error = res.error
      setEditingId(null)

    }else{

      const res = await supabase
        .from("exams")
        .insert([{ id: crypto.randomUUID(), ...payload }])

      error = res.error
    }

    if(error){
      alert(error.message)
      return
    }

    resetForm()
    loadExams()
  }

  // ================= DELETE =================
  const deleteExam = async (id:string)=>{

    const confirmDelete = confirm("Delete this exam?")
    if(!confirmDelete) return

    const { error } = await supabase
      .from("exams")
      .delete()
      .eq("id", id)

    if(error){
      alert(error.message)
      return
    }

    loadExams()
  }

  // ================= EDIT =================
  const editExam = (e:any)=>{
    setName(e.name)
    setSelectedClass(e.class_id || "")
    setSelectedSubject(e.subject_id || "")
    setExamDate(e.exam_date)
    setIsAllClasses(e.is_all_classes)
    setEditingId(e.id)
  }

  // ================= RESET =================
  const resetForm = ()=>{
    setName("")
    setSelectedClass("")
    setSelectedSubject("")
    setExamDate("")
    setIsAllClasses(false)
    setEditingId(null)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">Exams</h1>

      {/* FORM */}
      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        <input
          placeholder="Exam Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          className="p-3 w-full bg-[#0b1220] rounded-xl"
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isAllClasses}
            onChange={()=>setIsAllClasses(!isAllClasses)}
          />
          All Classes
        </label>

        {!isAllClasses && (
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="p-3 bg-[#0b1220] rounded-xl w-full"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          value={selectedSubject}
          onChange={(e)=>setSelectedSubject(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl w-full"
        >
          <option value="">Select Subject</option>
          {subjects.map(s=>(
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <input
          type="date"
          value={examDate}
          onChange={(e)=>setExamDate(e.target.value)}
          className="p-3 bg-[#0b1220] rounded-xl w-full"
        />

        <div className="flex gap-3">

          <button
            onClick={saveExam}
            className="px-6 py-3 bg-green-600 rounded-xl"
          >
            {editingId ? "Update" : "Create"}
          </button>

          <button
            onClick={resetForm}
            className="px-6 py-3 bg-gray-600 rounded-xl"
          >
            Clear
          </button>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="mb-4 text-lg">Created Exams</h2>

        <table className="w-full text-sm">

          <thead className="bg-white/10">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Class</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>

            {exams.map(e=>(
              <tr key={e.id} className="border-t border-white/10">

                <td className="p-3">{e.name}</td>

                <td className="p-3">
                  {e.is_all_classes ? "All Classes" : (e.classes?.name || "-")}
                </td>

                <td className="p-3">{e.subjects?.name || "-"}</td>
                <td className="p-3">{e.exam_date}</td>

                <td className="p-3 flex gap-2">

                  <button
                    onClick={()=>editExam(e)}
                    className="px-3 py-1 bg-blue-600 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={()=>deleteExam(e.id)}
                    className="px-3 py-1 bg-red-600 rounded"
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