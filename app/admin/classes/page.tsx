"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ClassesPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [teachers,setTeachers] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [showForm,setShowForm] = useState(false)

  const [form,setForm] = useState({
    name:"",
    capacity:40,
    teacher:""
  })

  const [schoolId,setSchoolId] = useState<string | null>(null)

  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD =================
  const load = async () => {

    if(!schoolId) return

    const { data: cls } = await supabase
      .from("classes")
      .select(`
        *,
        teachers(name)
      `)
      .eq("school_id", schoolId)

    const { data: t } = await supabase
      .from("teachers")
      .select("id,name")
      .eq("school_id", schoolId)

    const { data: s } = await supabase
      .from("students")
      .select("id,class_id")
      .eq("school_id", schoolId)

    setClasses(cls || [])
    setTeachers(t || [])
    setStudents(s || [])
  }

  useEffect(()=>{
    load()
  },[schoolId])

  // ================= ADD CLASS =================
  const addClass = async () => {

    if(!form.name) return

    await supabase.from("classes").insert({
      id: crypto.randomUUID(),
      name: form.name,
      capacity: form.capacity,
      class_teacher_id: form.teacher || null,
      school_id: schoolId
    })

    setShowForm(false)

    setForm({
      name:"",
      capacity:40,
      teacher:""
    })

    load()
  }

  // ================= COUNT STUDENTS =================
  const getStudentCount = (classId:string)=>{
    return students.filter(s=>s.class_id === classId).length
  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-center">

        <div>
          <h1 className="text-2xl font-bold">Classes</h1>
          <p className="text-gray-400 text-sm">
            Manage classes & capacity
          </p>
        </div>

        <button
          onClick={()=>setShowForm(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg"
        >
          + Add Class
        </button>

      </div>

      {/* 🔥 CLASS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {classes.map((c)=>{

          const count = getStudentCount(c.id)
          const percent = c.capacity
            ? Math.round((count / c.capacity) * 100)
            : 0

          return(

            <div
              key={c.id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4"
            >

              <div className="flex justify-between">

                <div>
                  <h2 className="text-lg font-semibold">
                    {c.name}
                  </h2>

                  <p className="text-sm text-gray-400">
                    Class Teacher
                  </p>
                </div>

                <div className="text-sm text-right">
                  {c.teachers?.name || "Not Assigned"}
                </div>

              </div>

              {/* STUDENTS */}
              <div className="flex justify-between text-sm">
                <span>Students</span>
                <span>{count}/{c.capacity}</span>
              </div>

              {/* BAR */}
              <div className="w-full bg-white/10 h-2 rounded-full">

                <div
                  className="bg-cyan-400 h-2 rounded-full"
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

      {/* 🔥 MODAL */}
      {showForm && (

        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[#020c1b] p-6 rounded-xl w-[400px] space-y-4">

            <h2 className="text-lg font-semibold">
              Add Class
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

              <button onClick={()=>setShowForm(false)}>
                Cancel
              </button>

              <button
                onClick={addClass}
                className="bg-green-500 px-4 py-2 rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}