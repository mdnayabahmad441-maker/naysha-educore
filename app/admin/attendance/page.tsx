"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { sendNotification } from "@/lib/notifications"
import { getActiveAcademicYear } from "@/lib/academic"
import { getCurrentTeacherClassIds } from "@/lib/role-access"
import { apiFetch } from "@/lib/api-client"
import { useSchool } from "@/context/SchoolContext"

type AttendancePageProps = {
  restrictToClassTeacher?: boolean
}

type AiAbsentMessage = {
  studentName: string
  message: string
}

type AiAttendanceSummary = {
  insight: string
  concern: string
  suggestion: string
  absentMessages: AiAbsentMessage[]
}

export default function AttendancePage({ restrictToClassTeacher = false }: AttendancePageProps){

  const school = useSchool()
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

  const [aiSummary, setAiSummary] = useState<AiAttendanceSummary | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

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

        // Step 1: fetch enrollment rows (no FK join — avoids PostgREST PGRST200)
        let enrollQuery = supabase
          .from("student_enrollments")
          .select("student_id")
          .eq("class_id", selectedClass)
          .eq("school_id", schoolId)

        if(year){
          enrollQuery = enrollQuery.eq("academic_year_id", year.id)
        }

        const { data: enrollments, error: enrollError } = await enrollQuery

        if(enrollError){
          console.error("Enrollment error:", enrollError)
        }

        const studentIds = (enrollments || [])
          .map((e: any) => e.student_id)
          .filter(Boolean) as string[]

        // Step 2: fetch student names separately
        if(studentIds.length > 0){
          const { data: studentData } = await supabase
            .from("students")
            .select("id, name")
            .in("id", studentIds)

          finalStudents = (studentData || []).map((s: any) => ({
            id: s.id,
            name: s.name || "Unknown",
          }))
        }

      }catch(err){
        console.error("Enrollment failed:", err)
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

      // DELETE + INSERT in parallel
      await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)
        .eq("date", selectedDate)

      const { error } = await supabase.from("attendance").insert(payload)

      if(error){
        alert(error.message)
        return
      }

      // ── Attendance saved — unblock the UI immediately ──────────────────
      setLoading(false)
      alert("Attendance saved ✅")

      // ── Fire all notifications in parallel (non-blocking) ──────────────
      const dateLabel = new Date(selectedDate).toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric",
      })

      await Promise.allSettled(
        students.flatMap((s: any) => {
          const status = attendance[s.id] || "present"
          const jobs: Promise<any>[] = []

          // DB notification
          jobs.push(
            sendNotification({
              school_id: schoolId!,
              student_id: s.id,
              title: status === "absent" ? "Attendance Alert" : "Attendance Update",
              message: status === "absent"
                ? `${s.name} was marked absent on ${dateLabel}. Kindly take note and ensure regular attendance.`
                : `${s.name} was marked present on ${dateLabel}. Thank you for ensuring regular attendance.`,
              type: "attendance",
            }).catch((err: any) => console.error("DB notification error:", err))
          )

          return jobs
        })
      )

    }catch(err){
      console.error(err)
      alert("Error saving attendance")
      setLoading(false)
    }
  }

  const analyseWithAi = async () => {
    if (!schoolId || !selectedClass || !students.length) return

    setAiLoading(true)
    setAiSummary(null)

    try {
      const className = classes.find(c => c.id === selectedClass)?.name || "Class"
      const absentStudents = students
        .filter(s => (attendance[s.id] || "present") === "absent")
        .map(s => ({ name: s.name, class: className }))

      const res = await apiFetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "attendance_summary",
          schoolId,
          schoolName: school?.name || "School",
          className,
          date: selectedDate,
          presentCount,
          absentCount,
          percentage,
          absentStudents
        })
      })

      const json = await res.json()
      if (!res.ok || !json?.data) throw new Error(json?.error || "AI failed")
      setAiSummary(json.data as AiAttendanceSummary)
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI analysis failed")
    } finally {
      setAiLoading(false)
    }
  }

  const copyMessage = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 2000)
    })
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

        <div className="sticky bottom-20 z-20 -mx-1 rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(8,15,30,0.96),rgba(11,26,51,0.9))] p-3 shadow-[0_24px_70px_rgba(2,8,23,0.38)] md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:shadow-none">
          <div className="flex gap-2">
            <button
              onClick={saveAttendance}
              disabled={loading}
              className="flex-1 rounded-2xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Save Attendance"}
            </button>
            {students.length > 0 && (
              <button
                onClick={analyseWithAi}
                disabled={aiLoading}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
              >
                {aiLoading ? "Analysing..." : "✦ AI Analyse"}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* AI ATTENDANCE ANALYSIS */}
      {aiSummary && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400">✦</span>
            <h2 className="font-semibold text-cyan-100">AI Attendance Analysis</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Insight</p>
              <p className="text-sm text-gray-200">{aiSummary.insight}</p>
            </div>
            {aiSummary.concern && (
              <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/5 p-4">
                <p className="text-xs text-yellow-400 uppercase tracking-wide mb-1">Concern</p>
                <p className="text-sm text-yellow-200">{aiSummary.concern}</p>
              </div>
            )}
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Suggestion</p>
              <p className="text-sm text-gray-200">{aiSummary.suggestion}</p>
            </div>
          </div>

          {aiSummary.absentMessages.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-cyan-300">
                WhatsApp Messages for Absent Students&apos; Parents
              </p>
              {aiSummary.absentMessages.map((item, i) => (
                <div key={i} className="rounded-xl bg-white/5 p-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{item.studentName}</p>
                    <p className="text-sm text-gray-200">{item.message}</p>
                  </div>
                  <button
                    onClick={() => copyMessage(item.message, i)}
                    className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10"
                  >
                    {copiedIdx === i ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
