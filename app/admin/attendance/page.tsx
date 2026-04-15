"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
import { getActiveAcademicYear } from "@/lib/academic"

export default function AttendancePage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [students,setStudents] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedDate,setSelectedDate] = useState("")

  const [attendance,setAttendance] = useState<any>({})
  const [loading,setLoading] = useState(false)

  const [presentCount,setPresentCount] = useState(0)
  const [absentCount,setAbsentCount] = useState(0)
  const [percentage,setPercentage] = useState(0)

  // ================= TODAY =================
  useEffect(()=>{
    const today = new Date().toISOString().split("T")[0]
    setSelectedDate(today)
  },[])

  // ================= SCHOOL =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= CLASSES =================
  useEffect(()=>{
    if(!schoolId) return

    supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // ================= LOAD STUDENTS =================
  useEffect(()=>{
    if(!selectedClass || !schoolId || !selectedDate) return

    const load = async ()=>{

      let finalStudents:any[] = []

      try{
        const year = await getActiveAcademicYear()

        let query = supabase
          .from("student_enrollments")
          .select(`
            student_id,
            students (
              id,
              name
            )
          `)
          .eq("class_id", selectedClass)
          .eq("school_id", schoolId)

        if(year){
          query = query.eq("academic_year_id", year.id)
        }

        const { data, error } = await query

        if(error){
          console.error("Enrollment error:", error)
        }

        if(data && data.length > 0){
          finalStudents = data.map((e:any)=>({
            id: e.student_id,
            name: e.students?.name || "Unknown"
          }))
        }

      }catch(err){
        console.error("Enrollment failed:", err)
      }

      // FALLBACK
      if(finalStudents.length === 0){

        const { data } = await supabase
          .from("students")
          .select("id,name")
          .eq("school_id", schoolId)

        finalStudents = (data || []).map((s:any)=>({
          id: s.id,
          name: s.name
        }))
      }

      setStudents(finalStudents)

      // LOAD ATTENDANCE
      const { data:attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)
        .eq("date", selectedDate)

      const map:any = {}

      attendanceData?.forEach((a:any)=>{
        map[a.student_id] = a.status
      })

      setAttendance(map)
    }

    load()

  },[selectedClass, schoolId, selectedDate])

  // ================= STATS =================
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

  // ================= SET STATUS =================
  const setStatus = (studentId:string, status:string)=>{
    setAttendance((prev:any)=>({
      ...prev,
      [studentId]: status
    }))
  }

  // ================= SAVE =================
  const saveAttendance = async ()=>{

    if(!schoolId || !selectedClass || !selectedDate){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    try{

      const payload = students.map((s:any)=>({
        id: crypto.randomUUID(),
        student_id: s.id,
        class_id: selectedClass,
        school_id: schoolId,
        status: attendance[s.id] || "present",
        date: selectedDate
      }))

      // DELETE OLD
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)
        .eq("date", selectedDate)

      // INSERT NEW
      const { error } = await supabase
        .from("attendance")
        .insert(payload)

      if(error){
        alert(error.message)
        return
      }

      // ================= NOTIFICATIONS =================
      const { data: parents } = await supabase
        .from("parents")
        .select("student_id, email, phone")
        .in("student_id", students.map(s=>s.id))

      const parentMap:any = {}
      parents?.forEach((p:any)=>{
        parentMap[p.student_id] = p
      })

      for (const s of students){

        const status = attendance[s.id] || "present"
        const parent = parentMap[s.id]

        // DB notification
        await sendNotification({
          school_id: schoolId,
          student_id: s.id,
          title: status === "absent"
            ? "Student Absent ❌"
            : "Student Present ✅",
          message: `${s.name} was ${status} on ${new Date(selectedDate).toLocaleDateString()}`,
          type: "attendance"
        })

        // ✅ WHATSAPP FIXED
        if(status === "absent" && parent?.phone){
          try{
            await fetch("/api/send-whatsapp",{
              method:"POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phone: parent.phone,
                message: `${s.name} was absent on ${new Date(selectedDate).toLocaleDateString()} ❌`
              })
            })
          }catch(err){
            console.error("WhatsApp error:", err)
          }
        }

        // ✅ EMAIL FIXED
        if(parent?.email){
          try{
            await fetch("/api/send-email",{
              method:"POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: parent.email,
                subject: "Attendance Update",
                message: `${s.name} is ${status} on ${new Date(selectedDate).toLocaleDateString()}`
              })
            })
          }catch(err){
            console.error("Email error:", err)
          }
        }

      }

      alert("Attendance saved + notifications sent ✅")

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

        <div className="flex flex-wrap gap-4">

          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e)=>setSelectedDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220]"
          />

        </div>

        <div className="grid grid-cols-3 gap-4">

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-green-400 text-2xl font-bold">{presentCount}</p>
            <p className="text-sm text-gray-400">Present</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-red-400 text-2xl font-bold">{absentCount}</p>
            <p className="text-sm text-gray-400">Absent</p>
          </div>

          <div className="bg-white/5 p-4 rounded-xl text-center">
            <p className="text-blue-400 text-2xl font-bold">{percentage}%</p>
            <p className="text-sm text-gray-400">Attendance Rate</p>
          </div>

        </div>

        <div className="space-y-3">

          {students.map((s:any)=>{

            const current = attendance[s.id] || "present"

            return(
              <div key={s.id} className="flex items-center justify-between bg-white/5 p-4 rounded-xl">

                <span>{s.name}</span>

                <div className="flex gap-2">

                  <button
                    onClick={()=>setStatus(s.id,"present")}
                    className={`px-4 py-2 rounded ${current === "present" ? "bg-green-500" : "bg-white/10"}`}
                  >
                    Present
                  </button>

                  <button
                    onClick={()=>setStatus(s.id,"absent")}
                    className={`px-4 py-2 rounded ${current === "absent" ? "bg-red-500" : "bg-white/10"}`}
                  >
                    Absent
                  </button>

                </div>

              </div>
            )
          })}

        </div>

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