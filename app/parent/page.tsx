"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ParentDashboard(){

  const [student,setStudent] = useState<any>(null)
  const [attendance,setAttendance] = useState<any[]>([])
  const [payments,setPayments] = useState<any[]>([])
  const [results,setResults] = useState<any[]>([])

  useEffect(()=>{

    const load = async ()=>{

      const { data:user } = await supabase.auth.getUser()

      if(!user?.user) return

      // 🔥 GET PARENT
      const { data:parent } = await supabase
        .from("parents")
        .select("*")
        .eq("email", user.user.email)
        .single()

      if(!parent) return

      // 🔥 GET STUDENT
      const { data:studentData } = await supabase
        .from("students")
        .select(`
          *,
          classes(name),
          sections(name)
        `)
        .eq("id", parent.student_id)
        .single()

      setStudent(studentData)

      // 🔥 ATTENDANCE
      const { data:att } = await supabase
        .from("attendance")
        .select("*")
        .eq("student_id", parent.student_id)
        .order("date",{ascending:false})

      setAttendance(att || [])

      // 🔥 PAYMENTS
      const { data:pay } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", parent.student_id)
        .order("date",{ascending:false})

      setPayments(pay || [])

      // 🔥 RESULTS
      const { data:res } = await supabase
        .from("results")
        .select("*")
        .eq("student_id", parent.student_id)
        .order("created_at",{ascending:false})

      setResults(res || [])

    }

    load()

  },[])

  if(!student){
    return <div className="p-10 text-white">Loading...</div>
  }

  // 📊 CALCULATIONS
  const presentDays = attendance.filter(a=>a.status==="present").length
  const totalDays = attendance.length
  const attendancePercent = totalDays ? ((presentDays/totalDays)*100).toFixed(1) : 0

  const totalFees = payments.reduce((sum,p)=>sum+p.amount,0)

  const lastResult = results[0]

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">

      {/* HEADER */}
      <div className="bg-white/10 border border-white/10 p-6 rounded-xl">

        <h1 className="text-2xl font-semibold">
          {student.name}
        </h1>

        <p className="text-gray-400 mt-1">
          {student.classes?.name} - {student.sections?.name}
        </p>

      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

        <div className="bg-white/10 p-6 rounded-xl text-center">
          <p className="text-gray-400 text-sm">Attendance</p>
          <h2 className="text-2xl font-bold">{attendancePercent}%</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl text-center">
          <p className="text-gray-400 text-sm">Fees Paid</p>
          <h2 className="text-2xl font-bold">₹{totalFees}</h2>
        </div>

        <div className="bg-white/10 p-6 rounded-xl text-center">
          <p className="text-gray-400 text-sm">Last Result</p>
          <h2 className="text-2xl font-bold">
            {lastResult ? `${lastResult.percentage.toFixed(1)}%` : "-"}
          </h2>
        </div>

      </div>

      {/* RECENT ACTIVITY */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ATTENDANCE */}
        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="mb-4">Recent Attendance</h2>

          {attendance.slice(0,5).map(a=>(
            <div key={a.id} className="flex justify-between border-b border-white/10 py-2">
              <p>{a.date}</p>
              <p>{a.status === "present" ? "✅" : "❌"}</p>
            </div>
          ))}

        </div>

        {/* PAYMENTS */}
        <div className="bg-white/10 p-6 rounded-xl">

          <h2 className="mb-4">Recent Payments</h2>

          {payments.slice(0,5).map(p=>(
            <div key={p.id} className="flex justify-between border-b border-white/10 py-2">
              <p>₹{p.amount}</p>
              <p>{p.date}</p>
            </div>
          ))}

        </div>

      </div>

    </div>
  )
}