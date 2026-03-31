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

  const [showForm,setShowForm] = useState(false)
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
  }

  useEffect(()=>{
    load()
  },[])

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

      // 🔥 REMOVE SUBJECTS NOT IN SELECTED CLASSES
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

  // ================= SUBMIT =================
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

      // 🔥 ASSIGN CLASSES
      if(form.selectedClasses.length){
        const classRows = form.selectedClasses.map(c=>({
          teacher_id: teacherId,
          class_id: c,
          school_id: schoolId
        }))

        await supabase.from("teacher_classes").insert(classRows)
      }

      // 🔥 ASSIGN SUBJECTS
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

      alert("✅ Teacher created + subjects assigned")

      setShowForm(false)

      setForm({
        name:"",
        email:"",
        phone:"",
        qualification:"",
        experience_years:"",
        selectedClasses:[],
        selectedSubjects:[]
      })

      load()

    }catch(err){
      console.error(err)
      alert("Error creating teacher")
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">Teachers</h1>
          <p className="text-gray-400 text-sm">
            Manage school teachers
          </p>
        </div>

        <Button onClick={()=>setShowForm(true)}>
          + Add Teacher
        </Button>

      </div>

      {/* TABLE */}
      <Card>

        <table className="w-full text-sm">

          <thead className="bg-white/10 text-gray-300">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
            </tr>
          </thead>

          <tbody>

            {teachers.map((t)=>(
              <tr key={t.id} className="border-t border-white/10">
                <td className="p-3">{t.name}</td>
                <td className="p-3">{t.phone || "-"}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </Card>

      {/* MODAL */}
      {showForm && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">

          <div className="bg-[#020c1b] p-6 rounded-xl w-[600px] space-y-4">

            <h2 className="text-lg font-semibold">
              Add Teacher
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <input placeholder="Name"
                value={form.name}
                onChange={e=>handleChange("name",e.target.value)}
                className="bg-white/10 p-2 rounded"/>

              <input placeholder="Email"
                value={form.email}
                onChange={e=>handleChange("email",e.target.value)}
                className="bg-white/10 p-2 rounded"/>

              <input placeholder="Phone"
                value={form.phone}
                onChange={e=>handleChange("phone",e.target.value)}
                className="bg-white/10 p-2 rounded"/>

              <input placeholder="Qualification"
                value={form.qualification}
                onChange={e=>handleChange("qualification",e.target.value)}
                className="bg-white/10 p-2 rounded"/>

              <input placeholder="Experience (years)"
                value={form.experience_years}
                onChange={e=>handleChange("experience_years",e.target.value)}
                className="bg-white/10 p-2 rounded"/>

            </div>

            {/* CLASSES */}
            <div>
              <p className="text-sm mb-2">Assign Classes</p>

              <div className="flex flex-wrap gap-2">

                {classes.map(c=>(
                  <button
                    key={c.id}
                    onClick={()=>toggleClass(c.id)}
                    className={`px-3 py-1 rounded text-sm ${
                      form.selectedClasses.includes(c.id)
                        ? "bg-blue-500"
                        : "bg-white/10"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}

              </div>
            </div>

            {/* 🔥 FILTERED SUBJECTS */}
            <div>
              <p className="text-sm mb-2">Assign Subjects</p>

              {filteredSubjects.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  Select class first
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">

                  {filteredSubjects.map(s=>(
                    <button
                      key={s.id}
                      onClick={()=>toggleSubject(s.id)}
                      className={`px-3 py-1 rounded text-sm ${
                        form.selectedSubjects.includes(s.id)
                          ? "bg-green-500"
                          : "bg-white/10"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}

                </div>
              )}

            </div>

            <div className="flex justify-end gap-3 pt-4">

              <Button onClick={()=>setShowForm(false)}>
                Cancel
              </Button>

              <Button color="green" onClick={submit} disabled={loading}>
                {loading ? "Creating..." : "Save Teacher"}
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}