"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getSettings, updateSettings } from "@/lib/settings"

export default function SettingsPage(){

  const [tab,setTab] = useState("school")
  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [school,setSchool] = useState<any>({})
  const [exam,setExam] = useState<any>({})
  const [fees,setFees] = useState<any>({})

  const [loading,setLoading] = useState(true)

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD ALL SETTINGS
  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      // SCHOOL
      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single()

      setSchool(data || {})

      // EXAM
      const examSettings = await getSettings("exam")
      setExam(examSettings || { passing: 33, grading: "percentage" })

      // FEES
      const feeSettings = await getSettings("fees")
      setFees(feeSettings || { late_fee: 0, prefix: "INV" })

      setLoading(false)
    }

    load()

  },[schoolId])

  // SAVE SCHOOL
  const saveSchool = async ()=>{

    await supabase
      .from("schools")
      .update({
        name: school.name,
        email: school.email,
        phone: school.phone,
        logo_url: school.logo_url
      })
      .eq("id", schoolId)

    alert("Saved ✅")
  }

  // SAVE EXAM
  const saveExam = async ()=>{
    await updateSettings("exam", exam)
    alert("Saved ✅")
  }

  // SAVE FEES
  const saveFees = async ()=>{
    await updateSettings("fees", fees)
    alert("Saved ✅")
  }

  if(loading) return <div className="p-10 text-white">Loading...</div>

  return(

    <div className="flex text-white">

      {/* LEFT MENU */}
      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">

        <button onClick={()=>setTab("school")} className="block w-full text-left">School</button>
        <button onClick={()=>setTab("exam")} className="block w-full text-left">Exam</button>
        <button onClick={()=>setTab("fees")} className="block w-full text-left">Fees</button>

      </div>

      {/* RIGHT CONTENT */}
      <div className="flex-1 p-10">

        {/* SCHOOL */}
        {tab==="school" && (
          <div className="space-y-4 max-w-lg">

            <h2 className="text-xl">School Profile</h2>

            <input value={school.name || ""} onChange={e=>setSchool({...school,name:e.target.value})} className="input"/>
            <input value={school.email || ""} onChange={e=>setSchool({...school,email:e.target.value})} className="input"/>
            <input value={school.phone || ""} onChange={e=>setSchool({...school,phone:e.target.value})} className="input"/>
            <input value={school.logo_url || ""} onChange={e=>setSchool({...school,logo_url:e.target.value})} className="input"/>

            <button onClick={saveSchool} className="btn">Save</button>

          </div>
        )}

        {/* EXAM */}
        {tab==="exam" && (
          <div className="space-y-4 max-w-lg">

            <h2 className="text-xl">Exam Settings</h2>

            <input
              type="number"
              value={exam.passing || 33}
              onChange={(e)=>setExam({...exam,passing:Number(e.target.value)})}
              className="input"
            />

            <select
              value={exam.grading}
              onChange={(e)=>setExam({...exam,grading:e.target.value})}
              className="input"
            >
              <option value="percentage">Percentage</option>
              <option value="grade">Grade</option>
              <option value="gpa">GPA</option>
            </select>

            <button onClick={saveExam} className="btn">Save</button>

          </div>
        )}

        {/* FEES */}
        {tab==="fees" && (
          <div className="space-y-4 max-w-lg">

            <h2 className="text-xl">Fees Settings</h2>

            <input
              type="number"
              value={fees.late_fee || 0}
              onChange={(e)=>setFees({...fees,late_fee:Number(e.target.value)})}
              className="input"
            />

            <input
              value={fees.prefix || ""}
              onChange={(e)=>setFees({...fees,prefix:e.target.value})}
              className="input"
            />

            <button onClick={saveFees} className="btn">Save</button>

          </div>
        )}

      </div>

      <style jsx>{`
        .input {
          width:100%;
          padding:12px;
          border-radius:8px;
          background:#0b1220;
        }
        .btn {
          padding:10px;
          background:rgba(255,255,255,0.1);
          border-radius:8px;
        }
      `}</style>

    </div>
  )
}