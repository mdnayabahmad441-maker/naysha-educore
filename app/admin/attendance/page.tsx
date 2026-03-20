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

  const today = new Date().toISOString().split("T")[0]

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
    if(!selectedClass) return

    const load = async ()=>{
      const { data } = await supabase
        .from("sections")
        .select("*")
        .eq("class_id", selectedClass)

      setSections(data || [])
    }

    load()
  },[selectedClass])

  // ✅ LOAD STUDENTS
  useEffect(()=>{
    if(!selectedSection) return

    const load = async ()=>{
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("section_id", selectedSection)

      setStudents(data || [])
    }

    load()
  },[selectedSection])

  // ✅ MARK ATTENDANCE
  const mark = (id:string,status:string)=>{
    setAttendance((prev:any)=>({
      ...prev,
      [id]: status
    }))
  }

  // ✅ SAVE ATTENDANCE
  const saveAttendance = async ()=>{

    if(!schoolId) return

    const records = students.map(s=>({
      id: crypto.randomUUID(),
      student_id: s.id,
      class_id: selectedClass,
      section_id: selectedSection,
      school_id: schoolId,
      date: today,
      status: attendance[s.id] || "absent"
    }))

    const { error } = await supabase
      .from("attendance")
      .upsert(records)

    if(error){
      alert("Error saving attendance")
      console.error(error)
      return
    }

    alert("Attendance Saved ✅")
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6 font-semibold">
        Attendance
      </h1>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl space-y-4">

        {/* SELECTORS */}
        <div className="flex gap-4 flex-wrap">

          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
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

        {/* STUDENTS */}
        <div className="space-y-2">

          {students.map(s=>(
            <div
              key={s.id}
              className="flex justify-between items-center bg-white/5 p-3 rounded-lg"
            >
              <span>{s.name}</span>

              <div className="flex gap-2">

                <button
                  onClick={()=>mark(s.id,"present")}
                  className={`px-3 py-1 rounded ${
                    attendance[s.id]==="present"
                      ? "bg-green-600"
                      : "bg-white/10"
                  }`}
                >
                  Present
                </button>

                <button
                  onClick={()=>mark(s.id,"absent")}
                  className={`px-3 py-1 rounded ${
                    attendance[s.id]==="absent"
                      ? "bg-red-600"
                      : "bg-white/10"
                  }`}
                >
                  Absent
                </button>

              </div>

            </div>
          ))}

        </div>

        {/* SAVE */}
        {students.length > 0 && (
          <button
            onClick={saveAttendance}
            className="mt-4 px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30"
          >
            Save Attendance
          </button>
        )}

      </div>

    </div>
  )
}