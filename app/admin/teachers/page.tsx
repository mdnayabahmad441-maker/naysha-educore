"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { getTeachers } from "@/services/teachers.service"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function TeachersPage(){

  const [teachers,setTeachers] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [teacherSubjects,setTeacherSubjects] = useState<any[]>([])

  const [showForm,setShowForm] = useState(false)
  const [selectedTeacher,setSelectedTeacher] = useState<any>(null)
  const [editingTeacher,setEditingTeacher] = useState<any>(null)

  const [loading,setLoading] = useState(false)

  const [form,setForm] = useState({
    name:"",
    email:"",
    phone:"",
    qualification:"",
    experience_years:""
  })

  // ================= FIX (MISSING FUNCTION) =================
  const handleChange = (key:string,val:any)=>{
    setForm(prev=>({...prev,[key]:val}))
  }

  // ================= LOAD =================
  const load = async () => {

    const data = await getTeachers()
    setTeachers(data)

    const schoolId = await getSchoolId()

    const { data: sub } = await supabase
      .from("subjects")
      .select("id,name")
      .eq("school_id", schoolId)

    setSubjects(sub || [])

    const { data: ts } = await supabase
      .from("teacher_subjects")
      .select("teacher_id,subject_id")
      .eq("school_id", schoolId)

    setTeacherSubjects(ts || [])
  }

  useEffect(()=>{
    load()
  },[])

  // ================= SUBJECT DISPLAY =================
  const getTeacherSubjects = (teacherId:string)=>{
    const subjectIds = teacherSubjects
      .filter(ts=>ts.teacher_id === teacherId)
      .map(ts=>ts.subject_id)

    const names = subjects
      .filter(s=>subjectIds.includes(s.id))
      .map(s=>s.name)

    return names.join(", ") || "-"
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
          ...form,
          experience_years: Number(form.experience_years),
          school_id: schoolId
        })
      })

      const data = await res.json()

      if(!res.ok){
        alert(data.error)
        return
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

  // ================= DELETE =================
  const deleteTeacher = async (id:string)=>{

    if(!confirm("Delete this teacher?")) return

    const schoolId = await getSchoolId()

    await supabase.from("teacher_subjects").delete().eq("teacher_id", id)
    await supabase.from("teacher_classes").delete().eq("teacher_id", id)

    await supabase
      .from("teachers")
      .delete()
      .eq("id", id)
      .eq("school_id", schoolId)

    alert("Deleted")
    setSelectedTeacher(null)
    load()
  }

  // ================= EDIT =================
  const openEdit = (teacher:any)=>{
    setSelectedTeacher(null)
    setEditingTeacher(teacher)

    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
      experience_years: teacher.experience_years || ""
    })

    setShowForm(true)
  }

  const resetForm = ()=>{
    setShowForm(false)
    setEditingTeacher(null)

    setForm({
      name:"",
      email:"",
      phone:"",
      qualification:"",
      experience_years:""
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

      {/* TABLE */}
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-white/10">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Subjects</th>
            </tr>
          </thead>

          <tbody>
            {teachers.map((t)=>(
              <tr
                key={t.id}
                onClick={()=>setSelectedTeacher(t)}
                className="border-t border-white/10 cursor-pointer hover:bg-white/5"
              >
                <td className="p-3">{t.name}</td>
                <td className="p-3">{getTeacherSubjects(t.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* PROFILE MODAL */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#020c1b] p-6 rounded-xl w-[500px] space-y-4">

            <h2 className="text-xl font-semibold">
              {selectedTeacher.name}
            </h2>

            <p className="text-gray-400">{selectedTeacher.email}</p>
            <p>📞 {selectedTeacher.phone || "-"}</p>

            <div>
              <p className="text-sm text-gray-400">Subjects</p>
              <p>{getTeacherSubjects(selectedTeacher.id)}</p>
            </div>

            <div className="flex justify-between pt-4">
              <Button onClick={()=>openEdit(selectedTeacher)}>Edit</Button>
              <Button color="red" onClick={()=>deleteTeacher(selectedTeacher.id)}>Delete</Button>
            </div>

            <div className="flex justify-end">
              <Button onClick={()=>setSelectedTeacher(null)}>Close</Button>
            </div>

          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#020c1b] p-6 rounded-xl w-[500px] space-y-4">

            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>

            <input placeholder="Name"
              value={form.name}
              onChange={e=>handleChange("name",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <input placeholder="Email"
              value={form.email}
              disabled={!!editingTeacher}
              onChange={e=>handleChange("email",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <input placeholder="Phone"
              value={form.phone}
              onChange={e=>handleChange("phone",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <input placeholder="Experience"
              value={form.experience_years}
              onChange={e=>handleChange("experience_years",e.target.value)}
              className="bg-white/10 p-2 rounded w-full"/>

            <div className="flex justify-end gap-3 pt-4">
              <Button onClick={resetForm}>Cancel</Button>

              <Button color="green"
                onClick={submit}
                disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}