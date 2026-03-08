"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ReportsPage(){

  const [attendanceCount,setAttendanceCount] = useState(0)
  const [feesCollected,setFeesCollected] = useState(0)
  const [resultsCount,setResultsCount] = useState(0)

  async function loadReports(){

    const {data:attendance} =
      await supabase.from("attendance").select("*")

    const {data:fees} =
      await supabase.from("fees").select("*")

    const {data:results} =
      await supabase.from("results").select("*")

    if(attendance) setAttendanceCount(attendance.length)

    if(results) setResultsCount(results.length)

    if(fees){

      const total =
        fees.reduce((sum,f)=>sum+Number(f.total || f.amount || 0),0)

      setFeesCollected(total)

    }

  }

  useEffect(()=>{
    loadReports()
  },[])

  return(

    <div>

      <h1 className="text-3xl font-bold mb-8">
        Reports & Analytics
      </h1>

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Attendance Records
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {attendanceCount}
          </h2>

        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Total Fees Collected
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            ₹{feesCollected}
          </h2>

        </div>

        <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl">

          <p className="text-gray-400">
            Exam Results Entered
          </p>

          <h2 className="text-3xl font-bold text-cyan-400 mt-2">
            {resultsCount}
          </h2>

        </div>

      </div>

    </div>

  )

}