"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { getTeachers } from "@/services/teachers.service"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function TeachersPage(){

  const [teachers,setTeachers] = useState<any[]>([])
  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [teacherSubjects,setTeacherSubjects] = useState<any[]>([]) // 🔥 NEW

  const [showForm,setShowForm] = useState(false)
  const [editingTeacher,setEditingTeacher] = useState<any>(null)

  const [loading,setLoading] = useState(false)

  const [form,setForm] = useState({
    name:"",
    email:"",
    phone:"",
    qualification:"",
    experience_years:"",
    selectedClasses:[] as string[],
    selectedSubjects:[] as string[]
  })

  // ================= LOAD DATA =================
  const load = async () => {

    const data = await getTeachers()
    setTeachers(data)

    const schoolId = await getSchoolId()

    const { data: cls } = await supabase
      .from("classes")
      .select("id,name")
      .eq("school_id",schoolId)

    setClasses(cls || [])

    const { data: sub } = await supabase
      .from("subjects")
      .select("id,name,class_id")
      .eq("school_id", schoolId)

    setSubjects(sub || [])

    // 🔥 LOAD TEACHER SUBJECTS
    const { data: ts } = await supabase
      .from("teacher_subjects")
      .select("teacher_id,subject_id")
      .eq("school_id", schoolId)

    setTeacherSubjects(ts || [])
  }

  useEffect(()=>{
    load()
  },[])

  // ================= GET SUBJECTS FOR TEACHER =================
  const getTeacherSubjects = (teacherId:string)=>{

    const subjectIds = teacherSubjects
      .filter(ts=>ts.teacher_id === teacherId)
      .map(ts=>ts.subject_id)

    const names = subjects
      .filter(s=>subjectIds.includes(s.id))
      .map(s=>s.name)

    return names.join(", ") || "-"
  }

  // ================= FILTER SUBJECTS =================
  const filteredSubjects = subjects.filter(s =>
    form.selectedClasses.includes(s.class_id)
  )

  // ================= FORM =================
  const handleChange = (key:string,val:any)=>{
    setForm(prev=>({...prev,[key]:val}))
  }

  const toggleClass = (id:string)=>{
    setForm(prev=>{
      const exists = prev.selectedClasses.includes(id)

      let newClasses = exists
        ? prev.selectedClasses.filter(c=>c!==id)
        : [...prev.selectedClasses,id]

      const validSubjects = prev.selectedSubjects.filter(sid=>{
        const subject = subjects.find(s=>s.id === sid)
        return subject && newClasses.includes(subject.class_id)
      })

      return {
        ...prev,
        selectedClasses: newClasses,
        selectedSubjects: validSubjects
      }
    })
  }

  const toggleSubject = (id:string)=>{
    setForm(prev=>{
      const exists = prev.selectedSubjects.includes(id)
      return {
        ...prev,
        selectedSubjects: exists
          ? prev.selectedSubjects.filter(s=>s!==id)
          : [...prev.selectedSubjects,id]
      }
    })
  }

  // ================= CREATE =================
  const submit = async () => {

    if(!form.name || !form.email){
      alert("Name & Email required")
      return
    }

    const schoolId = await getSchoolId()
    setLoading(true)

    try{

      const res = await fetch("/api/create-teacher",{
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          qualification: form.qualification,
          experience_years: Number(form.experience_years),
          school_id: schoolId
        })
      })

      const data = await res.json()

      if(!res.ok){
        alert(data.error)
        return
      }

      const teacherId = data.teacher.id

      if(form.selectedClasses.length){
        const classRows = form.selectedClasses.map(c=>({
          teacher_id: teacherId,
          class_id: c,
          school_id: schoolId
        }))
        await supabase.from("teacher_classes").insert(classRows)
      }

      if(form.selectedSubjects.length){
        const subjectRows = form.selectedSubjects.map(s=>{
          const subject = subjects.find(sub=>sub.id === s)

          return {
            teacher_id: teacherId,
            subject_id: s,
            class_id: subject?.class_id,
            school_id: schoolId
          }
        })
        await supabase.from("teacher_subjects").insert(subjectRows)
      }

      alert("✅ Teacher created")

      resetForm()
      load()

    }catch(err){
      console.error(err)
      alert("Error creating teacher")
    }finally{
      setLoading(false)
    }
  }

  // ================= UPDATE + DELETE (UNCHANGED) =================
  const updateTeacher = async () => { /* keep your same code */ }
  const deleteTeacher = async (id:string)=>{ /* keep your same code */ }
  const openEdit = async (teacher:any)=>{ /* keep your same code */ }

  const resetForm = ()=>{
    setShowForm(false)
    setEditingTeacher(null)
    setForm({
      name:"",
      email:"",
      phone:"",
      qualification:"",
      experience_years:"",
      selectedClasses:[],
      selectedSubjects:[]
    })
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teachers</h1>

        <Button onClick={()=>setShowForm(true)}>
          + Add Teacher
        </Button>
      </div>

      {/* 🔥 UPDATED TABLE */}
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Subjects</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t)=>(
              <tr key={t.id} className="border-t border-white/10">
                <td className="p-3">{t.name}</td>
                <td className="p-3">
                  {getTeacherSubjects(t.id)}
                </td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>openEdit(t)} className="text-blue-400">
                    Edit
                  </button>
                  <button onClick={()=>deleteTeacher(t.id)} className="text-red-400">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* MODAL (UNCHANGED) */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#020c1b] p-6 rounded-xl w-[600px] space-y-4">

            <h2 className="text-lg font-semibold">
              {editingTeacher ? "Edit Teacher" : "Add Teacher"}
            </h2>

            <input placeholder="Name" value={form.name}
              onChange={e=>handleChange("name",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <input placeholder="Email" value={form.email}
              disabled={!!editingTeacher}
              onChange={e=>handleChange("email",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <input placeholder="Phone" value={form.phone}
              onChange={e=>handleChange("phone",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={resetForm}>Cancel</Button>

              <Button color="green"
                onClick={editingTeacher ? updateTeacher : submit}
                disabled={loading}>
                {loading ? "Saving..." : editingTeacher ? "Update" : "Create"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}