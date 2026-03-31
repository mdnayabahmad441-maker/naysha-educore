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

  // 🔥 NEW STATES (ACADEMIC)
  const [years,setYears] = useState<any[]>([])
  const [yearName,setYearName] = useState("")

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

      // 🔥 LOAD ACADEMIC YEARS
      const { data: yrs } = await supabase
        .from("academic_years")
        .select("*")
        .eq("school_id", schoolId)
        .order("created_at",{ ascending:false })

      setYears(yrs || [])

      setLoading(false)
    }

    load()

  },[schoolId])

  // ================= ACADEMIC FUNCTIONS =================
  const reloadYears = async ()=>{
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)

    setYears(data || [])
  }

  const addYear = async ()=>{
    if(!yearName) return alert("Enter year")

    await supabase.from("academic_years").insert({
      id: crypto.randomUUID(),
      name: yearName,
      school_id: schoolId,
      is_active: false
    })

    setYearName("")
    reloadYears()
  }

  const setActiveYear = async (id:string)=>{

    await supabase
      .from("academic_years")
      .update({ is_active:false })
      .eq("school_id", schoolId)

    await supabase
      .from("academic_years")
      .update({ is_active:true })
      .eq("id", id)

    reloadYears()
  }

  const deleteYear = async (id:string)=>{
    if(!confirm("Delete year?")) return

    await supabase
      .from("academic_years")
      .delete()
      .eq("id", id)

    reloadYears()
  }

  // ================= YOUR EXISTING FUNCTIONS (UNCHANGED) =================
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
    await supabase.from("schools").update({
      name: school.name,
      email: school.email,
      phone: school.phone,
      address: school.address,
      website: school.website,
      logo_url: school.logo_url,
      stamp_url: school.stamp_url
    }).eq("id", schoolId)

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

      await supabase.from("class_fee_settings").upsert({
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

      {/* LEFT MENU */}
      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">
        <button onClick={()=>setTab("school")} className="block w-full text-left">School</button>
        <button onClick={()=>setTab("exam")} className="block w-full text-left">Exam</button>
        <button onClick={()=>setTab("fees")} className="block w-full text-left">Fees</button>

        {/* 🔥 NEW TAB */}
        <button onClick={()=>setTab("academic")} className="block w-full text-left text-cyan-400">
          Academic Year
        </button>
      </div>

      {/* RIGHT */}
      <div className="flex-1 p-10">

        {/* ================= ACADEMIC TAB ================= */}
        {tab==="academic" && (
          <div className="space-y-6 max-w-lg">

            <h2 className="text-xl font-semibold">
              Academic Year
            </h2>

            <div className="flex gap-3">
              <input
                placeholder="2024-2025"
                value={yearName}
                onChange={(e)=>setYearName(e.target.value)}
                className="input"
              />

              <button onClick={addYear} className="btn bg-green-600">
                Add
              </button>
            </div>

            <div className="space-y-3">
              {years.map(y=>(
                <div key={y.id}
                  className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">

                  <div>
                    <p className="font-semibold">{y.name}</p>
                    {y.is_active && (
                      <span className="text-green-400 text-sm">Active</span>
                    )}
                  </div>

                  <div className="flex gap-3 text-sm">

                    {!y.is_active && (
                      <button onClick={()=>setActiveYear(y.id)} className="text-blue-400">
                        Set Active
                      </button>
                    )}

                    <button onClick={()=>deleteYear(y.id)} className="text-red-400">
                      Delete
                    </button>

                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ================= YOUR ORIGINAL TABS (UNCHANGED) ================= */}
        {tab==="school" && (/* SAME AS YOUR CODE */ <div className="space-y-4 max-w-lg"> ... </div>)}
        {tab==="exam" && (/* SAME */ <div> ... </div>)}
        {tab==="fees" && (/* SAME */ <div> ... </div>)}

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
          border-radius:8px;
        }
      `}</style>

    </div>
  )
}