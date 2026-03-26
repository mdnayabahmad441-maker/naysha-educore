"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function FeeStructurePage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [selectedClass,setSelectedClass] = useState("")

  const [loading,setLoading] = useState(false)

  const [form,setForm] = useState({
    tuition:"",
    transport:"",
    hostel:"",
    misc:"",
    other:"",
    discount_amount:"",
    discount_last_date:"10"
  })

  // INIT
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // LOAD CLASSES
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id",schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // LOAD EXISTING STRUCTURE
  useEffect(()=>{

    if(!selectedClass || !schoolId) return

    const load = async ()=>{

      const { data } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("class_id", selectedClass)
        .eq("school_id", schoolId)
        .maybeSingle()

      if(data){
        setForm({
          tuition: data.tuition || "",
          transport: data.transport || "",
          hostel: data.hostel || "",
          misc: data.misc || "",
          other: data.other || "",
          discount_amount: data.discount_amount || "",
          discount_last_date: data.discount_last_date || "10"
        })
      }else{
        setForm({
          tuition:"",
          transport:"",
          hostel:"",
          misc:"",
          other:"",
          discount_amount:"",
          discount_last_date:"10"
        })
      }

    }

    load()

  },[selectedClass,schoolId])

  // UPDATE FIELD
  const updateField = (key:string,value:any)=>{
    setForm(prev=>({...prev,[key]:value}))
  }

  // SAVE STRUCTURE
  const save = async ()=>{

    if(!selectedClass){
      alert("Select class")
      return
    }

    setLoading(true)

    const payload = {
      school_id: schoolId,
      class_id: selectedClass,
      tuition: Number(form.tuition || 0),
      transport: Number(form.transport || 0),
      hostel: Number(form.hostel || 0),
      misc: Number(form.misc || 0),
      other: Number(form.other || 0),
      discount_amount: Number(form.discount_amount || 0),
      discount_last_date: Number(form.discount_last_date || 10)
    }

    const { error } = await supabase
      .from("fee_structures")
      .upsert([payload],{
        onConflict:"class_id"
      })

    if(error){
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Fee structure saved ✅")
    setLoading(false)
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-5xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Fee Structure Setup
      </h1>

      {/* CLASS SELECT */}
      <div className="bg-white/10 p-6 rounded-xl">

        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="w-full bg-[#0b1220] border border-white/10 px-4 py-3 rounded-xl"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

      </div>

      {/* FORM */}
      {selectedClass && (

        <div className="bg-white/10 p-6 rounded-xl space-y-6">

          <h2 className="text-lg font-semibold">
            Fee Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input placeholder="Tuition Fee"
              value={form.tuition}
              onChange={(e)=>updateField("tuition",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

            <input placeholder="Transport Fee"
              value={form.transport}
              onChange={(e)=>updateField("transport",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

            <input placeholder="Hostel Fee"
              value={form.hostel}
              onChange={(e)=>updateField("hostel",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

            <input placeholder="Misc Fee"
              value={form.misc}
              onChange={(e)=>updateField("misc",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

            <input placeholder="Other Fee"
              value={form.other}
              onChange={(e)=>updateField("other",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

          </div>

          <h2 className="text-lg font-semibold">
            Discount Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <input placeholder="Discount Amount"
              value={form.discount_amount}
              onChange={(e)=>updateField("discount_amount",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

            <input placeholder="Discount Last Date (Day)"
              value={form.discount_last_date}
              onChange={(e)=>updateField("discount_last_date",e.target.value)}
              className="p-3 bg-[#0b1220] rounded-xl" />

          </div>

          <button
            onClick={save}
            disabled={loading}
            className="bg-purple-600 px-6 py-3 rounded-xl"
          >
            {loading ? "Saving..." : "Save Structure"}
          </button>

        </div>

      )}

    </div>
  )
}