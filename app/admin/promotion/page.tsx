"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

export default function PromotionPage(){

  const [schoolId,setSchoolId] = useState<string | null>(null)

  const [years,setYears] = useState<any[]>([])
  const [currentYear,setCurrentYear] = useState("")
  const [nextYear,setNextYear] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [fromClass,setFromClass] = useState("")
  const [toClass,setToClass] = useState("")

  const [students,setStudents] = useState<any[]>([])
  const [selected,setSelected] = useState<any>({})

  const [loading,setLoading] = useState(false)

  // ================= SCHOOL =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD YEARS =================
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("academic_years")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setYears(data || []))
  },[schoolId])

  // ================= DEFAULT CURRENT YEAR =================
  useEffect(()=>{
    const init = async ()=>{
      const y = await getActiveAcademicYear()
      if(y){
        setCurrentYear(y.id)
      }
    }
    init()
  },[])

  // ================= LOAD CLASSES =================
  useEffect(()=>{
    if(!schoolId) return

    supabase.from("classes")
      .select("*")
      .eq("school_id", schoolId)
      .then(({data})=>setClasses(data || []))
  },[schoolId])

  // ================= LOAD STUDENTS =================
  useEffect(()=>{
    if(!fromClass || !currentYear || !schoolId) return

    const load = async ()=>{

      const { data } = await supabase
        .from("student_enrollments")
        .select(`
          student_id,
          roll_number,
          students(name)
        `)
        .eq("class_id", fromClass)
        .eq("academic_year_id", currentYear)
        .eq("school_id", schoolId)

      const formatted = (data || []).map((s:any)=>({
        id: s.student_id,
        name: s.students?.name,
        roll: s.roll_number
      }))

      setStudents(formatted)

      // default select all
      const map:any = {}
      formatted.forEach((s:any)=> map[s.id] = true)
      setSelected(map)
    }

    load()

  },[fromClass, currentYear, schoolId])

  // ================= TOGGLE =================
  const toggle = (id:string)=>{
    setSelected((prev:any)=>({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // ================= PROMOTE =================
  const promote = async ()=>{

    if(!toClass || !nextYear){
      alert("Select next class & year")
      return
    }

    setLoading(true)

    try{

      const payload:any[] = []

      students.forEach((s:any)=>{
        if(selected[s.id]){
          payload.push({
            id: crypto.randomUUID(),
            student_id: s.id,
            class_id: toClass,
            school_id: schoolId,
            academic_year_id: nextYear,
            roll_number: s.roll // keep same or modify later
          })
        }
      })

      if(payload.length === 0){
        alert("No students selected")
        return
      }

      const { error } = await supabase
        .from("student_enrollments")
        .insert(payload)

      if(error){
        alert(error.message)
        return
      }

      alert("Students promoted successfully 🚀")

    }catch(err){
      console.error(err)
      alert("Promotion failed")
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-6xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Student Promotion
      </h1>

      <div className="bg-white/10 p-6 rounded-xl space-y-4">

        {/* YEARS */}
        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={currentYear}
            onChange={(e)=>setCurrentYear(e.target.value)}
            className="p-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">Current Year</option>
            {years.map(y=>(
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>

          <select
            value={nextYear}
            onChange={(e)=>setNextYear(e.target.value)}
            className="p-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">Next Year</option>
            {years.map(y=>(
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>

        </div>

        {/* CLASSES */}
        <div className="grid md:grid-cols-2 gap-4">

          <select
            value={fromClass}
            onChange={(e)=>setFromClass(e.target.value)}
            className="p-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">From Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={toClass}
            onChange={(e)=>setToClass(e.target.value)}
            className="p-3 rounded-xl bg-[#0b1220]"
          >
            <option value="">To Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

        </div>

      </div>

      {/* STUDENTS */}
      <div className="bg-white/10 p-6 rounded-xl space-y-3">

        {students.length === 0 ? (
          <p className="text-gray-400">No students found</p>
        ) : (
          students.map((s:any)=>(
            <div
              key={s.id}
              className="flex justify-between items-center bg-white/5 p-3 rounded"
            >

              <span>
                {s.name} (Roll: {s.roll})
              </span>

              <input
                type="checkbox"
                checked={selected[s.id] || false}
                onChange={()=>toggle(s.id)}
              />

            </div>
          ))
        )}

      </div>

      {/* ACTION */}
      <button
        onClick={promote}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700"
      >
        {loading ? "Promoting..." : "Promote Students"}
      </button>

    </div>

  )
}