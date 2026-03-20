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

  // LOAD CLASSES
  const loadClasses = async () => {

    const schoolId = await getSchoolId()
    if (!schoolId) return

    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    setClasses(data || [])
  }

  // LOAD SECTIONS
  const loadSections = async () => {

    const schoolId = await getSchoolId()
    if (!schoolId) return

    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)

    setSections(data || [])
  }

  useEffect(()=>{
    loadClasses()
    loadSections()
  },[])

  // FILTER SECTIONS BASED ON CLASS
  const filteredSections = sections.filter(
    s => s.class_id === selectedClass
  )

  const save = async () => {

    const schoolId = await getSchoolId()

    if(!selectedClass || !selectedSection){
      alert("Select class & section")
      return
    }

    await supabase.from("students").insert([
      {
        id: crypto.randomUUID(),
        name,
        email,
        class_id: selectedClass,
        section_id: selectedSection,
        school_id: schoolId
      }
    ])

    setName("")
    setEmail("")
    setSelectedClass("")
    setSelectedSection("")

    reload()
  }

  return(

    <div className="flex flex-wrap gap-4">

      <input
        placeholder="Student Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      />

      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      />

      {/* CLASS DROPDOWN */}
      <select
        value={selectedClass}
        onChange={(e)=>{
          setSelectedClass(e.target.value)
          setSelectedSection("") // reset section
        }}
        className="p-2 bg-gray-800 rounded"
      >
        <option value="">Select Class</option>

        {classes.map(c=>(
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* SECTION DROPDOWN */}
      <select
        value={selectedSection}
        onChange={(e)=>setSelectedSection(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      >
        <option value="">Select Section</option>

        {filteredSections.map(s=>(
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <button
        onClick={save}
        className="bg-blue-600 px-4 rounded"
      >
        Save
      </button>

    </div>
  )
}