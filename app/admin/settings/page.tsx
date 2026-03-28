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
    getSchoolId().then(setSchoolId)
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

    alert("Saved ✅")
  }

  if(loading) return <div className="p-10 text-white">Loading...</div>

  return(

    <div className="flex text-white min-h-screen">

      {/* ⚠️ YOUR ORIGINAL SIDEBAR — UNTOUCHED */}
      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">
        <button onClick={()=>setTab("school")}>School</button>
        <button onClick={()=>setTab("exam")}>Exam</button>
        <button onClick={()=>setTab("fees")}>Fees</button>
      </div>

      {/* ⚠️ YOUR ORIGINAL CONTENT AREA — UNTOUCHED */}
      <div className="flex-1 p-10">

        {tab==="fees" && (
          <div className="space-y-6 max-w-2xl">

            <h2 className="text-xl">Class-wise Fees</h2>

            {classes.map(c=>(
              <div key={c.id} className="p-4 bg-[#0f172a] rounded">

                <p className="mb-3 font-semibold">{c.name}</p>

                {/* ✅ ONLY THIS BLOCK FIXED */}
                <div className="grid grid-cols-3 gap-4">

                  {/* TUITION */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Tuition Fee</p>
                    <input
                      type="number"
                      value={classFees[c.id]?.tuition || 0}
                      onChange={(e)=>setClassFees({
                        ...classFees,
                        [c.id]:{
                          ...classFees[c.id],
                          tuition:Number(e.target.value)
                        }
                      })}
                      className="input"
                    />
                  </div>

                  {/* TRANSPORT */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Transport Fee</p>
                    <input
                      type="number"
                      value={classFees[c.id]?.transport || 0}
                      onChange={(e)=>setClassFees({
                        ...classFees,
                        [c.id]:{
                          ...classFees[c.id],
                          transport:Number(e.target.value)
                        }
                      })}
                      className="input"
                    />
                  </div>

                  {/* HOSTEL */}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Hostel Fee</p>
                    <input
                      type="number"
                      value={classFees[c.id]?.hostel || 0}
                      onChange={(e)=>setClassFees({
                        ...classFees,
                        [c.id]:{
                          ...classFees[c.id],
                          hostel:Number(e.target.value)
                        }
                      })}
                      className="input"
                    />
                  </div>

                </div>

              </div>
            ))}

            <button onClick={saveClassFees} className="btn mt-4">
              Save Class Fees
            </button>

          </div>
        )}

      </div>

      <style jsx>{`
        .input {
          width:100%;
          padding:10px;
          border-radius:8px;
          background:#020617;
          border:1px solid rgba(255,255,255,0.1);
        }
        .btn {
          padding:10px;
          background:#1e293b;
          border-radius:8px;
        }
      `}</style>

    </div>
  )
}