"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ClassesPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [teachers,setTeachers] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState<any>(null) // 🔥 PROFILE
  const [editingClass,setEditingClass] = useState<any>(null)

  const [showForm,setShowForm] = useState(false)

  const [form,setForm] = useState({
    name:"",
    capacity:40,
    teacher:""
  })

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [loading,setLoading] = useState(true)

  // ================= INIT =================
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      if(!id){
        console.error("❌ No schoolId")
        return
      }
      setSchoolId(id)
    }
    init()
  },[])

  // ================= LOAD =================
  const load = async (id:string) => {

    const { data: cls } = await supabase
      .from("classes")
      .select(`*, teachers(name)`)
      .eq("school_id", id)

    const { data: t } = await supabase
      .from("teachers")
      .select("id,name")
      .eq("school_id", id)

    const { data: s } = await supabase
      .from("students")
      .select("id,class_id")
      .eq("school_id", id)

    setClasses(cls || [])
    setTeachers(t || [])
    setStudents(s || [])
    setLoading(false)
  }

  useEffect(()=>{
    if(!schoolId) return
    load(schoolId)
  },[schoolId])

  // ================= COUNT =================
  const getStudentCount = (classId:string)=>{
    return students.filter(s=>s.class_id === classId).length
  }

  // ================= CREATE =================
  const addClass = async () => {

    if(!form.name){
      alert("Class name required")
      return
    }

    if(!schoolId){
      alert("School not loaded")
      return
    }

    await supabase.from("classes").insert({
      id: crypto.randomUUID(),
      name: form.name,
      capacity: form.capacity,
      class_teacher_id: form.teacher || null,
      school_id: schoolId
    })

    resetForm()
    load(schoolId)
  }

  // ================= UPDATE =================
  const updateClass = async () => {

    if(!editingClass || !schoolId) return

    await supabase
      .from("classes")
      .update({
        name: form.name,
        capacity: form.capacity,
        class_teacher_id: form.teacher || null
      })
      .eq("id", editingClass.id)
      .eq("school_id", schoolId)

    alert("✅ Updated")

    resetForm()
    load(schoolId)
  }

  // ================= DELETE =================
  const deleteClass = async (id:string)=>{

    if(!confirm("Delete this class?")) return
    if(!schoolId) return

    await supabase
      .from("classes")
      .delete()
      .eq("id", id)
      .eq("school_id", schoolId)

    alert("Deleted")

    setSelectedClass(null)
    load(schoolId)
  }

  // ================= OPEN EDIT =================
  const openEdit = (c:any)=>{
    setSelectedClass(null)
    setEditingClass(c)

    setForm({
      name: c.name,
      capacity: c.capacity,
      teacher: c.class_teacher_id || ""
    })

    setShowForm(true)
  }

  const resetForm = ()=>{
    setShowForm(false)
    setEditingClass(null)

    setForm({
      name:"",
      capacity:40,
      teacher:""
    })
  }

  if(loading){
    return <div className="p-10 text-white">Loading...</div>
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Classes</h1>

        <button
          onClick={()=>setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"
        >
          + Add Class
        </button>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {classes.map((c)=>{

          const count = getStudentCount(c.id)
          const percent = c.capacity
            ? Math.round((count / c.capacity) * 100)
            : 0

          return(

            <div
              key={c.id}
              onClick={()=>setSelectedClass(c)}
              className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4 cursor-pointer hover:bg-white/5"
            >

              <div className="flex justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <p className="text-sm text-gray-400">Class Teacher</p>
                </div>

                <div className="text-sm text-right">
                  {c.teachers?.name || "Not Assigned"}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span>Students</span>
                <span>{count}/{c.capacity}</span>
              </div>

              <div className="w-full bg-white/10 h-2 rounded">
                <div
                  className="bg-cyan-400 h-2 rounded"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <p className="text-xs text-gray-400">
                {percent}% capacity
              </p>

            </div>
          )
        })}

      </div>

      {/* ================= PROFILE MODAL ================= */}
      {selectedClass && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[#020c1b] p-6 rounded-xl w-[400px] space-y-4">

            <h2 className="text-lg font-semibold">
              {selectedClass.name}
            </h2>

            <p>
              👨‍🏫 {selectedClass.teachers?.name || "No teacher"}
            </p>

            <p>
              👥 Students: {getStudentCount(selectedClass.id)}/{selectedClass.capacity}
            </p>

            <div className="flex justify-between pt-4">

              <button
                onClick={()=>openEdit(selectedClass)}
                className="text-blue-400"
              >
                Edit
              </button>

              <button
                onClick={()=>deleteClass(selectedClass.id)}
                className="text-red-400"
              >
                Delete
              </button>

            </div>

            <div className="flex justify-end">
              <button onClick={()=>setSelectedClass(null)}>
                Close
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ================= FORM MODAL ================= */}
      {showForm && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[#020c1b] p-6 rounded-xl w-[400px] space-y-4">

            <h2>
              {editingClass ? "Edit Class" : "Add Class"}
            </h2>

            <input
              placeholder="Class Name"
              value={form.name}
              onChange={(e)=>setForm({...form,name:e.target.value})}
              className="w-full p-2 bg-white/10 rounded"
            />

            <input
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={(e)=>setForm({...form,capacity:Number(e.target.value)})}
              className="w-full p-2 bg-white/10 rounded"
            />

            <select
              value={form.teacher}
              onChange={(e)=>setForm({...form,teacher:e.target.value})}
              className="w-full p-2 bg-white/10 rounded"
            >
              <option value="">Select Teacher</option>

              {teachers.map(t=>(
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">

              <button onClick={resetForm}>
                Cancel
              </button>

              <button
                onClick={editingClass ? updateClass : addClass}
                className="bg-green-500 px-4 py-2 rounded"
              >
                {editingClass ? "Update" : "Save"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}