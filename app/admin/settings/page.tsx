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

  const [years,setYears] = useState<any[]>([])
  const [yearName,setYearName] = useState("")

  const [loading,setLoading] = useState(true)
  // INIT
  useEffect(()=>{
    getSchoolId().then(id=>{
      console.log("School ID:", id)
      setSchoolId(id)
    })
  },[])

  // LOAD DATA
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

  // ================= FUNCTIONS =================

  const saveSchool = async ()=>{
    const { error } = await supabase
      .from("schools")
      .update(school)
      .eq("id", schoolId)

    if(error){
      console.error(error)
      alert(error.message)
    }else{
      alert("Saved ✅")
    }
  }

  const saveExam = async ()=>{
    try{
      await updateSettings("exam", exam)
      alert("Saved ✅")
    }catch(e){
      console.error(e)
      alert("Save failed")
    }
  }

  const saveFees = async ()=>{
    try{
      console.log("Saving fees:", fees)
      await updateSettings("fees", fees)
      alert("Saved ✅")
    }catch(e){
      console.error(e)
      alert("Save failed")
    }
  }

  const saveClassFees = async ()=>{
    for(const classId in classFees){

      const f = classFees[classId]

      const { error } = await supabase
        .from("class_fee_settings")
        .upsert({
          class_id: classId,
          school_id: schoolId,
          tuition_fee: Number(f.tuition || 0),
          transport_fee: Number(f.transport || 0),
          hostel_fee: Number(f.hostel || 0)
        },{
          onConflict:"class_id,school_id"
        })

      if(error){
        console.error(error)
        alert(error.message)
        return
      }
    }

    alert("Class Fees Saved ✅")
  }

  const reloadYears = async ()=>{
    const { data } = await supabase
      .from("academic_years")
      .select("*")
      .eq("school_id", schoolId)

    setYears(data || [])
  }

  const addYear = async ()=>{
    if(!yearName) return alert("Enter year")

    const { error } = await supabase
      .from("academic_years")
      .insert({
        id: crypto.randomUUID(),
        name: yearName,
        school_id: schoolId,
        is_active: false
      })

    if(error){
      console.error(error)
      alert(error.message)
      return
    }

    setYearName("")
    reloadYears()
  }

  const setActiveYear = async (id:string)=>{
    await supabase.from("academic_years").update({is_active:false}).eq("school_id", schoolId)
    await supabase.from("academic_years").update({is_active:true}).eq("id", id)
    reloadYears()
  }

  const deleteYear = async (id:string)=>{
    await supabase.from("academic_years").delete().eq("id", id)
    reloadYears()
  }

  if(loading) return <div className="p-10 text-white">Loading...</div>

  return(
    <div className="flex text-white min-h-screen">

      {/* SIDEBAR */}
      <div className="w-64 bg-[#0b1a33] p-6 space-y-3">
        <button onClick={()=>setTab("school")} className="block w-full text-left">School</button>
        <button onClick={()=>setTab("exam")} className="block w-full text-left">Exam</button>
        <button onClick={()=>setTab("fees")} className="block w-full text-left">Fees</button>
        <button onClick={()=>setTab("academic")} className="block w-full text-left text-cyan-400">
          Academic Year
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-10">

        {/* ================= SCHOOL ================= */}
        {tab==="school" && (
          <div className="space-y-4 max-w-lg">

            <input className="input" placeholder="Name"
              value={school.name || ""}
              onChange={(e)=>setSchool({...school,name:e.target.value})}
            />

            <input className="input" placeholder="Email"
              value={school.email || ""}
              onChange={(e)=>setSchool({...school,email:e.target.value})}
            />

            <input className="input" placeholder="Phone"
              value={school.phone || ""}
              onChange={(e)=>setSchool({...school,phone:e.target.value})}
            />

            <input className="input" placeholder="Address"
              value={school.address || ""}
              onChange={(e)=>setSchool({...school,address:e.target.value})}
            />

            <button onClick={saveSchool} className="btn bg-blue-600">Save</button>

          </div>
        )}

        {/* ================= EXAM ================= */}
        {tab==="exam" && (
          <div className="space-y-4 max-w-lg">

            <input className="input" placeholder="Passing %"
              value={exam.passing || ""}
              onChange={(e)=>setExam({...exam,passing:e.target.value})}
            />

            <select
              className="input"
              value={exam.grading || "percentage"}
              onChange={(e)=>setExam({...exam,grading:e.target.value})}
            >
              <option value="percentage">Percentage</option>
              <option value="grade">Grade</option>
            </select>

            <button onClick={saveExam} className="btn bg-blue-600">Save</button>

          </div>
        )}

        {/* ================= FEES ================= */}
        {tab==="fees" && (
          <div className="space-y-6">

            <div className="space-y-3 max-w-lg">
              <input className="input" placeholder="Prefix"
                value={fees.prefix || ""}
                onChange={(e)=>setFees({...fees,prefix:e.target.value})}
              />
              <input className="input" placeholder="Late Fee"
                value={fees.late_fee || ""}
                onChange={(e)=>setFees({...fees,late_fee:e.target.value})}
              />
              <button onClick={saveFees} className="btn bg-blue-600">Save</button>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg">Class Fees</h3>

              {classes.map(c=>(
                <div key={c.id} className="grid grid-cols-3 gap-2">
                  <input className="input"
                    value={classFees[c.id]?.tuition || ""}
                    onChange={(e)=>setClassFees({...classFees,[c.id]:{...classFees[c.id],tuition:e.target.value}})}
                    placeholder={`${c.name} Tuition`}
                  />
                  <input className="input"
                    value={classFees[c.id]?.transport || ""}
                    onChange={(e)=>setClassFees({...classFees,[c.id]:{...classFees[c.id],transport:e.target.value}})}
                    placeholder="Transport"
                  />
                  <input className="input"
                    value={classFees[c.id]?.hostel || ""}
                    onChange={(e)=>setClassFees({...classFees,[c.id]:{...classFees[c.id],hostel:e.target.value}})}
                    placeholder="Hostel"
                  />
                </div>
              ))}

              <button onClick={saveClassFees} className="btn bg-green-600">
                Save Class Fees
              </button>
            </div>

          </div>
        )}

        {/* ================= ACADEMIC ================= */}
        {tab==="academic" && (
          <div className="space-y-6 max-w-lg">

            <h2 className="text-xl font-semibold">Academic Year</h2>

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

            {years.map(y=>(
              <div key={y.id}
                className="bg-white/5 p-4 rounded-xl flex justify-between">

                <div>
                  <p>{y.name}</p>
                  {y.is_active && <span className="text-green-400 text-sm">Active</span>}
                </div>

                <div className="flex gap-3">
                  {!y.is_active && (
                    <button onClick={()=>setActiveYear(y.id)}>Active</button>
                  )}
                  <button onClick={()=>deleteYear(y.id)}>Delete</button>
                </div>

              </div>
            ))}

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
          border-radius:8px;
        }
      `}</style>

    </div>
  )
}
