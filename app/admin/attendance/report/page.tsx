"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function AttendanceReportPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")

  const [fromDate,setFromDate] = useState("")
  const [toDate,setToDate] = useState("")

  const [report,setReport] = useState<any[]>([])

  // ✅ INIT SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ LOAD CLASSES (MULTI-TENANT SAFE)
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      if(error){
        console.error(error)
        return
      }

      setClasses(data || [])
    }

    load()
  },[schoolId])

  // ✅ LOAD SECTIONS (FIXED: ADD SCHOOL FILTER)
  useEffect(()=>{
    if(!selectedClass || !schoolId) return

    const load = async ()=>{
      const { data, error } = await supabase
        .from("sections")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId) // 🔥 IMPORTANT FIX

      if(error){
        console.error(error)
        return
      }

      setSections(data || [])
    }

    load()
  },[selectedClass, schoolId])

  // ✅ GENERATE REPORT
  const generateReport = async ()=>{

    if(!selectedSection || !fromDate || !toDate || !schoolId){
      alert("Fill all filters")
      return
    }

    const { data, error } = await supabase
      .from("attendance")
      .select(`
        status,
        date,
        students(name)
      `)
      .eq("section_id", selectedSection)
      .eq("school_id", schoolId) // 🔥 MULTI-TENANT FIX
      .gte("date", fromDate)
      .lte("date", toDate)

    if(error){
      console.error(error)
      return
    }

    // 🔥 PROCESS DATA
    const map:any = {}

    data?.forEach((row:any)=>{
      const name = row.students?.name || "Unknown"

      if(!map[name]){
        map[name] = {
          name,
          total: 0,
          present: 0
        }
      }

      map[name].total += 1

      if(row.status === "present"){
        map[name].present += 1
      }
    })

    const final = Object.values(map).map((s:any)=>({
      ...s,
      percent: s.total ? ((s.present / s.total) * 100).toFixed(1) : 0
    }))

    setReport(final)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6 font-semibold">
        Attendance Report
      </h1>

      <div className="bg-white/10 backdrop-blur-lg p-6 rounded-xl space-y-4">

        {/* FILTERS */}
        <div className="flex flex-wrap gap-4">

          <select
            value={selectedClass}
            onChange={(e)=>{
              setSelectedClass(e.target.value)
              setSelectedSection("")
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

          <input
            type="date"
            value={fromDate}
            onChange={(e)=>setFromDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e)=>setToDate(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10"
          />

          <button
            onClick={generateReport}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 transition"
          >
            Generate
          </button>

        </div>

        {/* TABLE */}
        <div className="mt-6 overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-white/10">
              <tr>
                <th className="p-3 text-left">Student</th>
                <th className="p-3 text-left">Present</th>
                <th className="p-3 text-left">Total</th>
                <th className="p-3 text-left">%</th>
              </tr>
            </thead>

            <tbody>

              {report.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    No data found
                  </td>
                </tr>
              )}

              {report.map((r:any)=>(
                <tr key={r.name} className="border-t border-white/10">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3 text-green-400">{r.present}</td>
                  <td className="p-3">{r.total}</td>
                  <td className="p-3 text-blue-400">{r.percent}%</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  )
}