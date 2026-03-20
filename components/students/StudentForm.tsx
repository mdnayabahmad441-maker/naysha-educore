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

  const [loading,setLoading] = useState(false)

  // LOAD CLASSES
  const loadClasses = async () => {

    const schoolId = await getSchoolId()
    if (!schoolId) return

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    if(error){
      console.error("Classes Error:", error)
      return
    }

    setClasses(data || [])
  }

  // LOAD SECTIONS
  const loadSections = async () => {

    const schoolId = await getSchoolId()
    if (!schoolId) return

    const { data, error } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)

    if(error){
      console.error("Sections Error:", error)
      return
    }

    setSections(data || [])
  }

  useEffect(()=>{
    loadClasses()
    loadSections()
  },[])

  // FILTER SECTIONS BY CLASS
  const filteredSections = sections.filter(
    (s) => s.class_id === selectedClass
  )

  // SAVE STUDENT
  const save = async () => {

    setLoading(true)

    const schoolId = await getSchoolId()

    if (!schoolId) {
      alert("School not found")
      setLoading(false)
      return
    }

    if (!name || !email || !selectedClass || !selectedSection) {
      alert("Please fill all fields")
      setLoading(false)
      return
    }

    console.log({
      name,
      email,
      selectedClass,
      selectedSection,
      schoolId
    })

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
      console.error("INSERT ERROR:", error)
      alert(error.message)
      setLoading(false)
      return
    }

    alert("Student Added ✅")

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
        className="p-3 bg-white/10 border border-white/20 rounded-lg outline-none"
      />

      {/* EMAIL */}
      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="p-3 bg-white/10 border border-white/20 rounded-lg outline-none"
      />

      {/* CLASS */}
      <select
        value={selectedClass}
        onChange={(e)=>{
          setSelectedClass(e.target.value)
          setSelectedSection("") // reset section
        }}
        className="p-3 bg-white/10 border border-white/20 rounded-lg"
      >
        <option value="">Select Class</option>

        {classes.map((c)=>(
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}

      </select>

      {/* SECTION */}
      <select
        value={selectedSection}
        onChange={(e)=>setSelectedSection(e.target.value)}
        className="p-3 bg-white/10 border border-white/20 rounded-lg"
      >
        <option value="">Select Section</option>

        {filteredSections.map((s)=>(
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}

      </select>

      {/* SAVE BUTTON */}
      <button
        onClick={save}
        disabled={loading}
        className="px-6 py-3 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 transition"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>
  )
}