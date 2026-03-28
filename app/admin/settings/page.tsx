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

  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  useEffect(()=>{
    if(!schoolId) return

    const load = async ()=>{

      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("id", schoolId)
        .single()

      setSchool(data || {})

      const examSettings = await getSettings("exam")
      setExam(examSettings || { passing: 33, grading: "percentage" })

      const feeSettings = await getSettings("fees")
      setFees(feeSettings || {
        late_fee: 0,
        prefix: "INV",
        tuition_fee: 0,
        transport_fee: 0,
        hostel_fee: 0
      })

      setLoading(false)
    }

    load()

  },[schoolId])

  // 🔥 UPLOAD FUNCTION
  const uploadFile = async (file:File, folder:string)=>{

    const fileName = `${folder}/${Date.now()}-${file.name}`

    const { error } = await supabase.storage
      .from("school-assets")
      .upload(fileName, file)

    if(error){
      alert("Upload failed")
      return null
    }

    const { data } = supabase
      .storage
      .from("school-assets")
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  // SAVE SCHOOL
  const saveSchool = async ()=>{

    await supabase
      .from("schools")
      .update({
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        website: school.website,
        logo_url: school.logo_url,
        stamp_url: school.stamp_url
      })
      .eq("id", schoolId)

    alert("Saved ✅")
  }

  const saveExam = async ()=>{
    await updateSettings("exam", exam)
    alert("Saved ✅")
  }

  const saveFees = async ()=>{
    await updateSettings("fees", fees)
    alert("Saved ✅")
  }

  if(loading) return <div className="p-10 text-white">Loading...</div>

  return(

    <div className="flex text-white min-h-screen">

      {/* LEFT MENU */}
      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">

        <button onClick={()=>setTab("school")} className="block w-full text-left">School</button>
        <button onClick={()=>setTab("exam")} className="block w-full text-left">Exam</button>
        <button onClick={()=>setTab("fees")} className="block w-full text-left">Fees</button>

      </div>

      {/* RIGHT */}
      <div className="flex-1 p-10">

        {/* SCHOOL */}
        {tab==="school" && (
          <div className="space-y-4 max-w-lg">

            <h2 className="text-xl font-semibold">School Profile</h2>

            <input placeholder="Name" value={school.name || ""} onChange={e=>setSchool({...school,name:e.target.value})} className="input"/>
            <input placeholder="Email" value={school.email || ""} onChange={e=>setSchool({...school,email:e.target.value})} className="input"/>
            <input placeholder="Phone" value={school.phone || ""} onChange={e=>setSchool({...school,phone:e.target.value})} className="input"/>
            <input placeholder="Address" value={school.address || ""} onChange={e=>setSchool({...school,address:e.target.value})} className="input"/>
            <input placeholder="Website" value={school.website || ""} onChange={e=>setSchool({...school,website:e.target.value})} className="input"/>

            {/* LOGO UPLOAD */}
            <div>
              <label>Logo Upload</label>
              <input type="file" onChange={async (e)=>{
                const file = e.target.files?.[0]
                if(file){
                  const url = await uploadFile(file,"logos")
                  if(url) setSchool({...school,logo_url:url})
                }
              }}/>
            </div>

            {/* STAMP UPLOAD */}
            <div>
              <label>Stamp Upload</label>
              <input type="file" onChange={async (e)=>{
                const file = e.target.files?.[0]
                if(file){
                  const url = await uploadFile(file,"stamps")
                  if(url) setSchool({...school,stamp_url:url})
                }
              }}/>
            </div>

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

            <input type="number" placeholder="Late Fee"
              value={fees.late_fee || 0}
              onChange={(e)=>setFees({...fees,late_fee:Number(e.target.value)})}
              className="input"
            />

            <input placeholder="Invoice Prefix"
              value={fees.prefix || ""}
              onChange={(e)=>setFees({...fees,prefix:e.target.value})}
              className="input"
            />

            {/* 🔥 NEW FEE BREAKDOWN */}
            <input type="number" placeholder="Tuition Fee"
              value={fees.tuition_fee || 0}
              onChange={(e)=>setFees({...fees,tuition_fee:Number(e.target.value)})}
              className="input"
            />

            <input type="number" placeholder="Transport Fee"
              value={fees.transport_fee || 0}
              onChange={(e)=>setFees({...fees,transport_fee:Number(e.target.value)})}
              className="input"
            />

            <input type="number" placeholder="Hostel Fee"
              value={fees.hostel_fee || 0}
              onChange={(e)=>setFees({...fees,hostel_fee:Number(e.target.value)})}
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
          border:1px solid rgba(255,255,255,0.1);
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