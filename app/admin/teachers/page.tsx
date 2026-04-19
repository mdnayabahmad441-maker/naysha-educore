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
  const [teacherSubjects,setTeacherSubjects] = useState<any[]>([])

  const [showForm,setShowForm] = useState(false)
  const [selectedTeacher,setSelectedTeacher] = useState<any>(null)
  const [editingTeacher,setEditingTeacher] = useState<any>(null)

  const [,setLoading] = useState(false)

  const [form,setForm] = useState({
    name:"",
    email:"",
    phone:"",
    qualification:"",
    experience_years:"",
    selectedClasses:[] as string[],
    selectedSubjects:[] as string[]
  })

  // ================= LOAD =================
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

    const { data: ts } = await supabase
      .from("teacher_subjects")
      .select("teacher_id,subject_id")
      .eq("school_id", schoolId)

    setTeacherSubjects(ts || [])
  }

  useEffect(()=>{
    load()
  },[])

  // ================= HANDLE CHANGE =================
  const handleChange = (key:string,val:any)=>{
    setForm(prev=>({...prev,[key]:val}))
  }

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

  // ================= FILTER SUBJECTS =================
  const filteredSubjects = subjects.filter(s =>
    form.selectedClasses.includes(s.class_id)
  )

  // ================= TOGGLE =================
  const toggleClass = (id:string)=>{
    setForm(prev=>{
      const exists = prev.selectedClasses.includes(id)

      const newClasses = exists
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

      const teacherId = data.teacher?.id

      // classes
      if(form.selectedClasses.length){
        const rows = form.selectedClasses.map(c=>({
          teacher_id: teacherId,
          class_id: c,
          school_id: schoolId
        }))
        await supabase.from("teacher_classes").insert(rows)
      }

      // subjects
      if(form.selectedSubjects.length){
        const rows = form.selectedSubjects.map(s=>{
          const subject = subjects.find(sub=>sub.id === s)

          return {
            teacher_id: teacherId,
            subject_id: s,
            class_id: subject?.class_id,
            school_id: schoolId
          }
        })
        await supabase.from("teacher_subjects").insert(rows)
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

  // ================= UPDATE =================
  const updateTeacher = async () => {

    if(!editingTeacher) return

    const schoolId = await getSchoolId()
    setLoading(true)

    try{

      await supabase
        .from("teachers")
        .update({
          name: form.name,
          phone: form.phone,
          qualification: form.qualification,
          experience_years: Number(form.experience_years)
        })
        .eq("id", editingTeacher.id)
        .eq("school_id", schoolId)

      // reset relations
      await supabase.from("teacher_classes").delete().eq("teacher_id", editingTeacher.id)
      await supabase.from("teacher_subjects").delete().eq("teacher_id", editingTeacher.id)

      // reinsert classes
      if(form.selectedClasses.length){
        const rows = form.selectedClasses.map(c=>({
          teacher_id: editingTeacher.id,
          class_id: c,
          school_id: schoolId
        }))
        await supabase.from("teacher_classes").insert(rows)
      }

      // reinsert subjects
      if(form.selectedSubjects.length){
        const rows = form.selectedSubjects.map(s=>{
          const subject = subjects.find(sub=>sub.id === s)

          return {
            teacher_id: editingTeacher.id,
            subject_id: s,
            class_id: subject?.class_id,
            school_id: schoolId
          }
        })
        await supabase.from("teacher_subjects").insert(rows)
      }

      alert("✅ Teacher updated")

      resetForm()
      load()

    }catch(err){
      console.error(err)
      alert("Update failed")
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

  // ================= EDIT OPEN =================
  const openEdit = async (teacher:any)=>{

    const { data: cls } = await supabase
      .from("teacher_classes")
      .select("class_id")
      .eq("teacher_id", teacher.id)

    const { data: sub } = await supabase
      .from("teacher_subjects")
      .select("subject_id")
      .eq("teacher_id", teacher.id)

    setSelectedTeacher(null)
    setEditingTeacher(teacher)

    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      qualification: teacher.qualification || "",
      experience_years: teacher.experience_years || "",
      selectedClasses: cls?.map(c=>c.class_id) || [],
      selectedSubjects: sub?.map(s=>s.subject_id) || []
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
      experience_years:"",
      selectedClasses:[],
      selectedSubjects:[]
    })
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <Button onClick={()=>setShowForm(true)}>+ Add Teacher</Button>
      </div>

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
              <tr key={t.id}
                onClick={()=>setSelectedTeacher(t)}
                className="border-t cursor-pointer hover:bg-white/5">
                <td className="p-3">{t.name}</td>
                <td className="p-3">{getTeacherSubjects(t.id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* PROFILE */}
      {selectedTeacher && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#020c1b] p-6 rounded-xl w-[500px] space-y-4">
            <h2>{selectedTeacher.name}</h2>
            <p>{selectedTeacher.email}</p>
            <p>{getTeacherSubjects(selectedTeacher.id)}</p>

            <div className="flex justify-between">
              <Button onClick={()=>openEdit(selectedTeacher)}>Edit</Button>
              <Button color="red" onClick={()=>deleteTeacher(selectedTeacher.id)}>Delete</Button>
            </div>

            <Button onClick={()=>setSelectedTeacher(null)}>Close</Button>
          </div>
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-[#020c1b] p-6 rounded-xl w-[600px] space-y-4">

            <h2>{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h2>

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

            {/* CLASSES */}
            <div>
              <p>Classes</p>
              <div className="flex gap-2 flex-wrap">
                {classes.map(c=>(
                  <button key={c.id}
                    onClick={()=>toggleClass(c.id)}
                    className={form.selectedClasses.includes(c.id) ? "bg-blue-500 px-2" : "bg-white/10 px-2"}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            {/* SUBJECTS */}
            <div>
              <p>Subjects</p>
              <div className="flex gap-2 flex-wrap">
                {filteredSubjects.map(s=>(
                  <button key={s.id}
                    onClick={()=>toggleSubject(s.id)}
                    className={form.selectedSubjects.includes(s.id) ? "bg-green-500 px-2" : "bg-white/10 px-2"}>
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button onClick={resetForm}>Cancel</Button>
              <Button onClick={editingTeacher ? updateTeacher : submit}>
                {editingTeacher ? "Update" : "Create"}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
