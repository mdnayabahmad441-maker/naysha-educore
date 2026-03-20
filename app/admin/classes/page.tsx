"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function ClassesPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [className,setClassName] = useState("")
  const [sectionName,setSectionName] = useState("")
  const [selectedClass,setSelectedClass] = useState("")

  const load = async () => {

    const schoolId = await getSchoolId()
    if(!schoolId) return

    // GET CLASSES
    const { data:cls } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id",schoolId)

    setClasses(cls || [])

    // GET SECTIONS
    const { data:sec } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id",schoolId)

    setSections(sec || [])
  }

  useEffect(()=>{
    load()
  },[])

  // ADD CLASS
  const addClass = async () => {

    const schoolId = await getSchoolId()

    await supabase.from("classes").insert([
      {
        id: crypto.randomUUID(),
        school_id: schoolId,
        name: className
      }
    ])

    setClassName("")
    load()
  }

  // ADD SECTION
  const addSection = async () => {

    if(!selectedClass){
      alert("Select class first")
      return
    }

    const schoolId = await getSchoolId()

    await supabase.from("sections").insert([
      {
        id: crypto.randomUUID(),
        school_id: schoolId,
        class_id: selectedClass,
        name: sectionName
      }
    ])

    setSectionName("")
    load()
  }

  return(

    <div className="space-y-6">

      <h1 className="text-2xl font-semibold">Classes & Sections</h1>

      <div className="bg-white/10 p-6 rounded-xl">

        {/* ADD CLASS */}
        <input
          placeholder="Class Name"
          value={className}
          onChange={(e)=>setClassName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white"
        />

        <button
          onClick={addClass}
          className="bg-green-600 px-4 py-2 rounded mb-6"
        >
          Add Class
        </button>

        {/* ADD SECTION */}
        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 rounded"
        >
          <option value="">Select Class</option>

          {classes.map((c)=>(
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Section Name (A,B,C)"
          value={sectionName}
          onChange={(e)=>setSectionName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-800 text-white"
        />

        <button
          onClick={addSection}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Add Section
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white/10 p-6 rounded-xl">

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">Class</th>
              <th className="border p-2">Sections</th>
            </tr>
          </thead>

          <tbody>

            {classes.map((c)=>{

              const sec = sections
                .filter(s=>s.class_id === c.id)
                .map(s=>s.name)
                .join(", ")

              return(
                <tr key={c.id}>
                  <td className="border p-2">{c.name}</td>
                  <td className="border p-2">{sec || "-"}</td>
                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

    </div>
  )
}