"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function AttendancePage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")

  const [attendance,setAttendance] = useState<any>({})
  const [loading,setLoading] = useState(false)

  // ✅ INIT SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ LOAD CLASSES
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

  // ✅ LOAD SECTIONS
  useEffect(()=>{
    if(!selectedClass || !schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("sections")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)

      setSections(data || [])
    }

    load()
  },[selectedClass, schoolId])

  // ✅ LOAD STUDENTS
  useEffect(()=>{
    if(!selectedSection || !schoolId) return

    const load = async ()=>{
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("section_id", selectedSection)
        .eq("school_id", schoolId)

      setStudents(data || [])
    }

    load()
  },[selectedSection, schoolId])

  // ✅ TOGGLE ATTENDANCE
  const setStatus = (studentId:string, status:string)=>{
    setAttendance((prev:any)=>({
      ...prev,
      [studentId]: status
    }))
  }

  // 🔥 SAVE ATTENDANCE (FINAL FIXED)
  const saveAttendance = async ()=>{

    if(!schoolId || !selectedClass || !selectedSection){
      alert("Select class & section")
      return
    }

    if(students.length === 0){
      alert("No students found")
      return
    }

    setLoading(true)

    try{

      const today = new Date().toISOString().split("T")[0]

      const payload = students.map((s:any)=>({
        id: crypto.randomUUID(),
        student_id: s.id,
        class_id: selectedClass,     // ✅ REQUIRED
        section_id: selectedSection,
        school_id: schoolId,         // ✅ MULTI-TENANT FIX
        status: attendance[s.id] || "present",
        date: today
      }))

      const { error } = await supabase
        .from("attendance")
        .insert(payload)

      if(error){
        console.error(error)
        alert(error.message)
        return
      }

      alert("Attendance saved successfully")

      // RESET
      setAttendance({})

    }catch(err){
      console.error(err)
      alert("Something went wrong")
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto">

      <h1 className="text-2xl mb-6 font-semibold">
        Attendance
      </h1>

      <div className="bg-white/10 p-6 rounded-xl space-y-6">

        {/* SELECTORS */}
        <div className="flex flex-wrap gap-4">

          <select
            value={selectedClass}
            onChange={(e)=>{
              setSelectedClass(e.target.value)
              setSelectedSection("")
              setStudents([])
            }}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e)=>setSelectedSection(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10"
          >
            <option value="">Select Section</option>
            {sections.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

        </div>

        {/* STUDENTS LIST */}
        <div className="space-y-3">

          {students.map((s:any)=>{

            const current = attendance[s.id] || "present"

            return(

              <div
                key={s.id}
                className="flex items-center justify-between bg-white/5 p-4 rounded-xl"
              >

                <span>{s.name}</span>

                <div className="flex gap-2">

                  <button
                    onClick={()=>setStatus(s.id,"present")}
                    className={`px-4 py-2 rounded-lg ${
                      current === "present"
                        ? "bg-green-500"
                        : "bg-white/10"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={()=>setStatus(s.id,"absent")}
                    className={`px-4 py-2 rounded-lg ${
                      current === "absent"
                        ? "bg-red-500"
                        : "bg-white/10"
                    }`}
                  >
                    Absent
                  </button>

                </div>

              </div>

            )
          })}

        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={saveAttendance}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Attendance"}
        </button>

      </div>

    </div>
  )
}