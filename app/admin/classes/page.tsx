"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ClassesPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [teachers,setTeachers] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState<any>(null)
  const [editingClass,setEditingClass] = useState<any>(null)

  const [showForm,setShowForm] = useState(false)

  const [form,setForm] = useState({
    name:"",
    capacity:40,
    teacher:""
  })

  const [schoolId,setSchoolId] = useState<string | null>(null)

  // ================= INIT =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
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
    if(!form.name || !schoolId) return

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

    resetForm()
    load(schoolId)
  }

  // ================= DELETE =================
  const deleteClass = async (id:string)=>{
    if(!confirm("Delete this class?") || !schoolId) return

    await supabase
      .from("classes")
      .delete()
      .eq("id", id)
      .eq("school_id", schoolId)

    setSelectedClass(null)
    load(schoolId)
  }

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

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-8 bg-gradient-to-br from-[#020617] via-[#020617] to-[#03132a] min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            Classes
          </h1>
          <p className="text-gray-400 text-sm">
            Manage classes, teachers & capacity
          </p>
        </div>

        <button
          onClick={()=>setShowForm(true)}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:scale-105 transition"
        >
          + Add Class
        </button>

      </div>

      {/* GRID */}
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
              className="group relative p-[1px] rounded-2xl bg-gradient-to-br from-white/10 to-transparent hover:from-cyan-500/40 transition cursor-pointer"
            >
              <div className="bg-[#020c1b]/90 backdrop-blur rounded-2xl p-6 space-y-4">

                <div className="flex justify-between">
                  <div>
                    <h2 className="text-lg font-semibold group-hover:text-cyan-400 transition">
                      {c.name}
                    </h2>
                    <p className="text-xs text-gray-400">
                      Class Teacher
                    </p>
                  </div>

                  <div className="text-sm text-cyan-400 font-medium">
                    {c.teachers?.name || "Not Assigned"}
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-300">
                  <span>Students</span>
                  <span>{count}/{c.capacity}</span>
                </div>

                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <p className="text-xs text-gray-400">
                  {percent}% capacity
                </p>

              </div>
            </div>
          )
        })}

      </div>

      {/* PROFILE MODAL */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">

          <div className="bg-[#020c1b] border border-white/10 p-6 rounded-2xl w-[420px] space-y-4 shadow-2xl">

            <h2 className="text-xl font-semibold text-cyan-400">
              {selectedClass.name}
            </h2>

            <p className="text-gray-400 text-sm">
              👨‍🏫 {selectedClass.teachers?.name || "No teacher assigned"}
            </p>

            <p className="text-gray-300">
              👥 Students: {getStudentCount(selectedClass.id)}/{selectedClass.capacity}
            </p>

            <div className="flex justify-between pt-4">

              <button
                onClick={()=>openEdit(selectedClass)}
                className="px-4 py-1 rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
              >
                Edit
              </button>

              <button
                onClick={()=>deleteClass(selectedClass.id)}
                className="px-4 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
              >
                Delete
              </button>

            </div>

            <div className="flex justify-end">
              <button
                onClick={()=>setSelectedClass(null)}
                className="text-gray-400 hover:text-white"
              >
                Close
              </button>
            </div>

          </div>

        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50">

          <div className="bg-[#020c1b] border border-white/10 p-6 rounded-2xl w-[420px] space-y-4 shadow-2xl">

            <h2 className="text-lg font-semibold">
              {editingClass ? "Edit Class" : "Add Class"}
            </h2>

            <input
              placeholder="Class Name"
              value={form.name}
              onChange={(e)=>setForm({...form,name:e.target.value})}
              className="w-full p-2 bg-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />

            <input
              type="number"
              value={form.capacity}
              onChange={(e)=>setForm({...form,capacity:Number(e.target.value)})}
              className="w-full p-2 bg-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none"
            />

            <select
              value={form.teacher}
              onChange={(e)=>setForm({...form,teacher:e.target.value})}
              className="w-full p-2 bg-white/10 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t=>(
                <option key={t.id} value={t.id} className="text-black">
                  {t.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">

              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                Cancel
              </button>

              <button
                onClick={editingClass ? updateClass : addClass}
                className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 rounded-lg"
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