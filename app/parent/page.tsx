"use client"

import { useEffect, useState } from "react"
import { getCurrentParentStudentIds } from "@/lib/role-access"
import { supabase } from "@/lib/supabase"

type StudentRecord = {
  id: string
  name: string
  class_id: string | null
}

type NamedRecord = {
  id: string
  name: string | null
}

type ChildSummary = {
  student: StudentRecord & {
    class_name: string | null
  }
  attendance: any[]
  payments: any[]
  results: any[]
}

// small wait helper (important for session delay)
const wait = (ms: number) => new Promise((res) => setTimeout(res, ms))

export default function ParentDashboard(){
  const [children,setChildren] = useState<ChildSummary[]>([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    const load = async ()=>{
      setLoading(true)

      try{

        let studentIds: string[] = []

        //  retry logic
        for (let attempt = 0; attempt < 5; attempt++) {
          if (attempt > 0) await wait(400)

          try {
            studentIds = await getCurrentParentStudentIds()
            console.log("[ParentDashboard] studentIds:", studentIds)

            if (studentIds.length > 0) break
          } catch (e) {
            console.warn("Retry error:", e)
          }

          //  refresh session between retries
          await supabase.auth.refreshSession()
        }

        // prevent false empty state
        if(studentIds.length === 0){
          console.warn("No student found after retries")
          setChildren([])
          return
        }

        const { data:students, error:studentsError } = await supabase
          .from("students")
          .select("id,name,class_id")
          .in("id", studentIds)

        if(studentsError){
          throw studentsError
        }

        const studentRows = (students as StudentRecord[] | null) || []

        const classIds = [
          ...new Set(
            studentRows
              .map((student)=>student.class_id)
              .filter((id): id is string => Boolean(id))
          )
        ]

        const [classesRes, attendanceRes, paymentsRes, resultsRes] =
          await Promise.all([
            classIds.length
              ? supabase.from("classes").select("id,name").in("id", classIds)
              : Promise.resolve({ data: [] as NamedRecord[], error: null }),

            supabase
              .from("attendance")
              .select("*")
              .in("student_id", studentIds)
              .order("date",{ascending:false}),

            supabase
              .from("payments")
              .select("*")
              .in("student_id", studentIds)
              .order("date",{ascending:false}),

            supabase
              .from("results")
              .select("*")
              .in("student_id", studentIds)
              .order("created_at",{ascending:false})
          ])

        if(classesRes.error) {
          console.error("Parent classes load error:", classesRes.error)
        }

        const classMap = new Map(
          ((classesRes.data as NamedRecord[] | null) || []).map((item)=>[
            item.id,
            item.name
          ])
        )

        setChildren(studentRows.map((student)=>({
          student: {
            ...student,
            class_name: student.class_id
              ? classMap.get(student.class_id) || null
              : null
          },
          attendance: (attendanceRes.data || []).filter((item)=>item.student_id === student.id),
          payments: (paymentsRes.data || []).filter((item)=>item.student_id === student.id),
          results: (resultsRes.data || []).filter((item)=>item.student_id === student.id)
        })))

      }catch(error){
        console.error("Parent dashboard load error:", error)
        setChildren([])
      }finally{
        setLoading(false)
      }
    }

    void load()
  },[])

  if(loading){
    return <div className="p-10 text-white">Loading...</div>
  }

  if(children.length === 0){
    return <div className="p-10 text-white">No children linked to this parent account.</div>
  }

  return(
    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold">Parent Dashboard</h1>

      {children.map(({ student, attendance, payments, results })=>{
        const presentDays = attendance.filter((item)=>item.status==="present").length

        const attendancePercent = attendance.length
          ? ((presentDays/attendance.length)*100).toFixed(1)
          : "0"

        const totalFees = payments.reduce(
          (sum,item)=>sum + Number(item.amount || 0),0
        )

        const lastResult = results[0]

        return(
          <div key={student.id} className="space-y-6 rounded-xl border border-white/10 bg-white/10 p-6">

            <div>
              <h2 className="text-2xl font-semibold">{student.name}</h2>
              <p className="text-gray-400 mt-1">
                {student.class_name || "-"}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white/10 p-6 rounded-xl text-center">
                <p className="text-gray-400 text-sm">Attendance</p>
                <h3 className="text-2xl font-bold">{attendancePercent}%</h3>
              </div>

              <div className="bg-white/10 p-6 rounded-xl text-center">
                <p className="text-gray-400 text-sm">Fees Paid</p>
                <h3 className="text-2xl font-bold">Rs. {totalFees}</h3>
              </div>

              <div className="bg-white/10 p-6 rounded-xl text-center">
                <p className="text-gray-400 text-sm">Last Result</p>
                <h3 className="text-2xl font-bold">
                  {lastResult
                    ? `${Number(lastResult.percentage || 0).toFixed(1)}%`
                    : "-"}
                </h3>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/10 p-6 rounded-xl">
                <h3 className="mb-4">Recent Attendance</h3>
                {attendance.slice(0,5).map((item)=>(
                  <div key={item.id} className="flex justify-between border-b border-white/10 py-2">
                    <p>{item.date}</p>
                    <p>{item.status === "present" ? "Present" : "Absent"}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white/10 p-6 rounded-xl">
                <h3 className="mb-4">Recent Payments</h3>
                {payments.slice(0,5).map((item)=>(
                  <div key={item.id} className="flex justify-between border-b border-white/10 py-2">
                    <p>Rs. {item.amount}</p>
                    <p>{item.date}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}
