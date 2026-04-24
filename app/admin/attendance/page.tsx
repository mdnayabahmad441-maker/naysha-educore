"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
import { getActiveAcademicYear } from "@/lib/academic"
import { getCurrentTeacherClassIds } from "@/lib/role-access"
import { apiFetch } from "@/lib/api-client"

type AttendancePageProps = {
  restrictToClassTeacher?: boolean
}

export default function AttendancePage({ restrictToClassTeacher = false }: AttendancePageProps){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [allowedClassIds,setAllowedClassIds] = useState<string[]>([])
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

    const load = async ()=>{
      const teacherClassIds = restrictToClassTeacher
        ? await getCurrentTeacherClassIds()
        : []

      setAllowedClassIds(teacherClassIds)

      let query = supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      if(restrictToClassTeacher){
        if(teacherClassIds.length === 0){
          setClasses([])
          return
        }

        query = query.in("id", teacherClassIds)
      }

      const { data } = await query
      setClasses(data || [])
    }

    void load()
  },[schoolId, restrictToClassTeacher])

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

        const fallbackQuery = supabase
          .from("students")
          .select("id,name")
          .eq("school_id", schoolId)
          .eq("class_id", selectedClass)

        const { data } = await fallbackQuery
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

    if(restrictToClassTeacher && !allowedClassIds.includes(selectedClass)){
      alert("You can mark attendance only for your assigned class")
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
            await apiFetch("/api/send-whatsapp",{
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
            await apiFetch("/api/send-email",{
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
    <div className="mx-auto max-w-6xl space-y-8 p-4 pb-28 text-white md:p-10 md:pb-10">

      <div className="space-y-2">
        <h1 className="text-2xl font-bold md:text-3xl">Attendance</h1>
        <p className="text-sm text-slate-400">
          Select class, mark students quickly, and save from mobile without scrolling back.
        </p>
      </div>

      <div className="space-y-6 rounded-[28px] bg-white/10 p-4 shadow-[0_20px_60px_rgba(2,8,23,0.22)] md:p-6">

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="w-full rounded-2xl bg-[#0b1220] px-4 py-3"
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
            className="w-full rounded-2xl bg-[#0b1220] px-4 py-3 md:w-auto"
          />
        </div>

        {restrictToClassTeacher && classes.length === 0 && (
          <p className="rounded-2xl border border-yellow-300/20 bg-yellow-300/10 px-4 py-3 text-sm text-yellow-200">
            No class is assigned to you as class teacher.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <p className="text-green-400 text-2xl font-bold">{presentCount}</p>
            <p className="text-sm text-gray-400">Present</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <p className="text-red-400 text-2xl font-bold">{absentCount}</p>
            <p className="text-sm text-gray-400">Absent</p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 text-center">
            <p className="text-blue-400 text-2xl font-bold">{percentage}%</p>
            <p className="text-sm text-gray-400">Attendance Rate</p>
          </div>

        </div>

        <div className="space-y-3">

          {students.map((s:any)=>{

            const current = attendance[s.id] || "present"

            return(
              <div key={s.id} className="rounded-2xl bg-white/5 p-4">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      Current: {current === "present" ? "Present" : "Absent"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex">

                    <button
                      onClick={()=>setStatus(s.id,"present")}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium ${current === "present" ? "bg-green-500 text-white" : "bg-white/10 text-white"}`}
                    >
                      Present
                    </button>

                    <button
                      onClick={()=>setStatus(s.id,"absent")}
                      className={`rounded-xl px-4 py-2.5 text-sm font-medium ${current === "absent" ? "bg-red-500 text-white" : "bg-white/10 text-white"}`}
                    >
                      Absent
                    </button>

                  </div>
                </div>

              </div>
            )
          })}

        </div>

        <div className="sticky bottom-20 z-20 -mx-1 rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,26,51,0.9))] p-3 shadow-[0_24px_70px_rgba(2,8,23,0.38)] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <button
            onClick={saveAttendance}
            disabled={loading}
            className="w-full rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Save Attendance"}
          </button>
        </div>

      </div>

    </div>
  )
}
