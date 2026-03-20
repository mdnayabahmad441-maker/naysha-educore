"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function StudentForm({ reload }: any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [loading,setLoading] = useState(false)

  // ✅ LOAD SCHOOL ONCE
  useEffect(()=>{
    const init = async () => {
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ LOAD DATA AFTER SCHOOL
  useEffect(()=>{
    if(!schoolId) return
    loadClasses()
    loadSections()
  },[schoolId])

  const loadClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    setClasses(data || [])
  }

  const loadSections = async () => {
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)

    setSections(data || [])
  }

  // ✅ FILTER SECTIONS
  const filteredSections = sections.filter(
    (s) => s.class_id === selectedClass
  )

  // ✅ SAVE
  const save = async () => {

    if (!schoolId) {
      alert("School not found")
      return
    }

    if (!name || !email || !selectedClass || !selectedSection) {
      alert("Fill all fields")
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from("students")
      .insert([
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          email: email.trim(),
          class_id: selectedClass,
          section_id: selectedSection,
          school_id: schoolId
        }
      ])

    if (error) {
      console.error(error)
      alert(error.message)
      setLoading(false)
      return
    }

    setName("")
    setEmail("")
    setSelectedClass("")
    setSelectedSection("")

    reload()
    setLoading(false)
  }

  return (

    <div className="flex flex-wrap gap-4 items-center">

      {/* NAME */}
      <input
        placeholder="Student Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* EMAIL */}
      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      {/* CLASS */}
      <select
        value={selectedClass}
        onChange={(e)=>{
          setSelectedClass(e.target.value)
          setSelectedSection("")
        }}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <option value="" className="bg-[#0b1220]">Select Class</option>

        {classes.map((c)=>(
          <option key={c.id} value={c.id} className="bg-[#0b1220]">
            {c.name}
          </option>
        ))}
      </select>

      {/* SECTION */}
      <select
        value={selectedSection}
        onChange={(e)=>setSelectedSection(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white outline-none focus:ring-2 focus:ring-blue-500 transition"
      >
        <option value="" className="bg-[#0b1220]">Select Section</option>

        {filteredSections.map((s)=>(
          <option key={s.id} value={s.id} className="bg-[#0b1220]">
            {s.name}
          </option>
        ))}
      </select>

      {/* BUTTON */}
      <button
        onClick={save}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 transition text-white font-medium"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>
  )
}