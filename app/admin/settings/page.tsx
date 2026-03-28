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

  const [classes,setClasses] = useState<any[]>([])
  const [classFees,setClassFees] = useState<any>({})

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

      const { data: cls } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      setClasses(cls || [])

      const { data: classFeeData } = await supabase
        .from("class_fee_settings")
        .select("*")
        .eq("school_id", schoolId)

      const map:any = {}

      cls?.forEach((c:any)=>{
        const existing = classFeeData?.find((f:any)=>f.class_id === c.id)

        map[c.id] = {
          tuition: existing?.tuition_fee || 0,
          transport: existing?.transport_fee || 0,
          hostel: existing?.hostel_fee || 0
        }
      })

      setClassFees(map)
      setLoading(false)
    }

    load()

  },[schoolId])

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

  const saveClassFees = async ()=>{
    for(const classId in classFees){

      const f = classFees[classId]

      await supabase
        .from("class_fee_settings")
        .upsert({
          class_id: classId,
          school_id: schoolId,
          tuition_fee: f.tuition,
          transport_fee: f.transport,
          hostel_fee: f.hostel
        },{
          onConflict:"class_id,school_id"
        })
    }

    alert("Class Fees Saved ✅")
  }

  if(loading) return <div className="p-10 text-white">Loading...</div>

  return(

    <div className="flex text-white min-h-screen">

      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">
        <button onClick={()=>setTab("school")}>School</button>
        <button onClick={()=>setTab("exam")}>Exam</button>
        <button onClick={()=>setTab("fees")}>Fees</button>
      </div>

      <div className="flex-1 p-10">

        {tab==="fees" && (
          <div className="space-y-6 max-w-2xl">

            <h2 className="text-xl">Fees Settings</h2>

            {/* YOUR ORIGINAL FIELDS */}
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

            <button onClick={saveFees} className="btn">Save Global Fees</button>

            {/* ✅ FIXED UI ONLY */}
            <div className="space-y-4 mt-6">

              <h3 className="text-lg">Class-wise Fees</h3>

              {classes.map(c=>(
                <div key={c.id} className="p-4 bg-[#0f172a] rounded">

                  <p className="mb-2 font-semibold">{c.name}</p>

                  {/* ONLY CHANGE BELOW */}
                  <div className="grid grid-cols-3 gap-3">

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-400 mb-1">
                        Tuition Fee
                      </label>
                      <input
                        type="number"
                        value={classFees[c.id]?.tuition || 0}
                        onChange={(e)=>setClassFees({
                          ...classFees,
                          [c.id]:{...classFees[c.id],tuition:Number(e.target.value)}
                        })}
                        className="input"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-400 mb-1">
                        Transport Fee
                      </label>
                      <input
                        type="number"
                        value={classFees[c.id]?.transport || 0}
                        onChange={(e)=>setClassFees({
                          ...classFees,
                          [c.id]:{...classFees[c.id],transport:Number(e.target.value)}
                        })}
                        className="input"
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-xs text-gray-400 mb-1">
                        Hostel Fee
                      </label>
                      <input
                        type="number"
                        value={classFees[c.id]?.hostel || 0}
                        onChange={(e)=>setClassFees({
                          ...classFees,
                          [c.id]:{...classFees[c.id],hostel:Number(e.target.value)}
                        })}
                        className="input"
                      />
                    </div>

                  </div>

                </div>
              ))}

              <button onClick={saveClassFees} className="btn">
                Save Class Fees
              </button>

            </div>

          </div>
        )}

      </div>

      <style jsx>{`
        .input {
          width:100%;
          padding:10px;
          border-radius:6px;
          background:#020617;
        }
        .btn {
          padding:10px;
          background:#1e293b;
          border-radius:6px;
        }
      `}</style>

    </div>
  )
}