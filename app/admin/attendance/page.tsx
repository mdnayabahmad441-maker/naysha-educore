"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"

export default function AttendancePage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")
  const [selectedDate,setSelectedDate] = useState("")

  const [attendance,setAttendance] = useState<any>({})
  const [loading,setLoading] = useState(false)

  // 🔥 NEW STATS
  const [presentCount,setPresentCount] = useState(0)
  const [absentCount,setAbsentCount] = useState(0)
  const [percentage,setPercentage] = useState(0)

  // ✅ TODAY
  useEffect(()=>{
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
  },[])

  // ✅ SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ CLASSES (UNCHANGED)
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // ✅ SECTIONS (UNCHANGED)
  useEffect(()=>{
    if(!selectedClass || !schoolId) return

    supabase.from("sections")
      .select("*")
      .eq("class_id", selectedClass)
      .eq("school_id", schoolId)
      .then(({data})=>setSections(data || []))
  },[selectedClass, schoolId])

  // ✅ STUDENTS + EXISTING ATTENDANCE (UNCHANGED)
  useEffect(()=>{
    if(!selectedSection || !schoolId || !selectedDate) return

    const load = async ()=>{

      const { data:studentsData } = await supabase
        .from("students")
        .select("*")
        .eq("section_id", selectedSection)
        .eq("school_id", schoolId)

      setStudents(studentsData || [])

      const { data:attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("section_id", selectedSection)
        .eq("school_id", schoolId)
        .eq("date", selectedDate)

      const map:any = {}

      attendanceData?.forEach((a:any)=>{
        map[a.student_id] = a.status
      })

      setAttendance(map)
    }

    load()

  },[selectedSection, schoolId, selectedDate])

  // 🔥 CALCULATE STATS (NEW)
  useEffect(()=>{

    if(!students.length){
      setPresentCount(0)
      setAbsentCount(0)
      setPercentage(0)
      return
    }

    let present = 0
    let absent = 0

    students.forEach((s:any)=>{
      const status = attendance[s.id] || "present"

      if(status === "present") present++
      else absent++
    })

    const percent = Math.round((present / students.length) * 100)

    setPresentCount(present)
    setAbsentCount(absent)
    setPercentage(percent)

  },[attendance, students])

  // ✅ SET STATUS (UNCHANGED)
  const setStatus = (studentId:string, status:string)=>{
    setAttendance((prev:any)=>({
      ...prev,
      [studentId]: status
    }))
  }

  // 🔥 SAVE ATTENDANCE (UNCHANGED)
  const saveAttendance = async ()=>{

    if(!schoolId || !selectedClass || !selectedSection || !selectedDate){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    try{

      const payload = students.map((s:any)=>({
        id: crypto.randomUUID(),
        student_id: s.id,
        class_id: selectedClass,
        section_id: selectedSection,
        school_id: schoolId,
        status: attendance[s.id] || "present",
        date: selectedDate
      }))

      await supabase
        .from("attendance")
        .delete()
        .eq("section_id", selectedSection)
        .eq("school_id", schoolId)
        .eq("date", selectedDate)

      const { error } = await supabase
        .from("attendance")
        .insert(payload)

      if(error){
        console.error(error)
        alert(error.message)
        return
      }

      // 🔥 NOTIFICATIONS (UNCHANGED)
      for (const s of students){

        const status = attendance[s.id] || "present"
        const type = s.student_type?.toLowerCase()

        if(status === "absent"){
          await sendNotification({
            school_id: schoolId,
            student_id: s.id,
            title: "Student Absent ❌",
            message: `${s.name} was absent on ${new Date(selectedDate).toLocaleDateString()}`,
            type: "attendance"
          })
        }
        else if(status === "present" && type !== "hosteler"){
          await sendNotification({
            school_id: schoolId,
            student_id: s.id,
            title: "Student Present ✅",
            message: `${s.name} is present on ${new Date(selectedDate).toLocaleDateString()}`,
            type: "attendance"
          })
        }

      }

      alert("Attendance saved successfully ✅")

    }catch(err){
      console.error(err)
      alert("Error saving attendance")
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-8">

      <h1 className="text-3xl font-bold">Attendance</h1>

      <div className="bg-white/10 p-6 rounded-xl space-y-6">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4">

          <select
            value={selectedClass}
            onChange={(e)=>{
              setSelectedClass(e.target.value)
              setSelectedSection("")
            }}
            className="px-4 py-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e)=>setSelectedSection(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">Select Section</option>
            {sections.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e)=>setSelectedDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220]"
          />

        </div>

        {/* 🔥 STATS */}
        <div className="grid grid-cols-3 gap-4">

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-green-400 text-2xl font-bold">
              {presentCount}
            </p>
            <p className="text-sm text-gray-400">Present</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-red-400 text-2xl font-bold">
              {absentCount}
            </p>
            <p className="text-sm text-gray-400">Absent</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-blue-400 text-2xl font-bold">
              {percentage}%
            </p>
            <p className="text-sm text-gray-400">Attendance Rate</p>
          </div>

        </div>

        {/* STUDENTS */}
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
                    className={`px-4 py-2 rounded ${
                      current === "present"
                        ? "bg-green-500"
                        : "bg-white/10"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    onClick={()=>setStatus(s.id,"absent")}
                    className={`px-4 py-2 rounded ${
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

        {/* SAVE */}
        <button
          onClick={saveAttendance}
          disabled={loading}
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700"
        >
          {loading ? "Saving..." : "Save Attendance"}
        </button>

      </div>

    </div>
  )
}