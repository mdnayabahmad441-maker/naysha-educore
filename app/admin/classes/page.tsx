"use client"

import { useEffect, useState } from "react"
import { dbGet, dbInsert } from "@/lib/db"
import { getSchoolId } from "@/lib/school" // ✅ ADD THIS

export default function ClassesPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [className,setClassName] = useState("")
  const [sectionName,setSectionName] = useState("")
  const [selectedClass,setSelectedClass] = useState("")

  const [schoolId,setSchoolId] = useState<string | null>(null) // ✅ ADD

  // ================= LOAD SCHOOL =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD DATA =================
 const load = async () => {

  if (!schoolId) return // ✅ correct

  const cls = await dbGet("classes")
  setClasses(cls || [])

  const sec = await dbGet("sections")
  setSections(sec || [])
}

  useEffect(()=>{
    load()
  },[schoolId]) // ✅ FIX

  // ================= ADD CLASS =================
  const addClass = async () => {

    if(!className) return
    if(!schoolId){
      alert("School not loaded")
      return
    }

    await dbInsert("classes", {
      id: crypto.randomUUID(),
      name: className,
      school_id: schoolId // ✅ CRITICAL FIX
    })

    setClassName("")
    load()
  }

  // ================= ADD SECTION =================
  const addSection = async () => {

    if(!selectedClass){
      alert("Select class first")
      return
    }

    if(!sectionName) return
    if(!schoolId){
      alert("School not loaded")
      return
    }

    await dbInsert("sections", {
      id: crypto.randomUUID(),
      class_id: selectedClass,
      name: sectionName,
      school_id: schoolId // ✅ CRITICAL FIX
    })

    setSectionName("")
    load()
  }

  return(

    <div className="space-y-6">

      <h1 className="text-2xl font-semibold text-white">Classes & Sections</h1>

      <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/10">

        {/* ADD CLASS */}
        <input
          placeholder="Class Name"
          value={className}
          onChange={(e)=>setClassName(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
        />

        <button
          onClick={addClass}
          className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition mb-6"
        >
          Add Class
        </button>

        {/* ADD SECTION */}
        <select
          value={selectedClass}
          onChange={(e)=>setSelectedClass(e.target.value)}
          className="w-full p-3 mb-4 bg-[#0b1220] border border-white/10 rounded-xl text-white focus:outline-none focus:border-white/30"
        >
          <option value="" className="bg-[#0b1220] text-gray-300">
            Select Class
          </option>

          {classes.map((c)=>(
            <option
              key={c.id}
              value={c.id}
              className="bg-[#0b1220] text-white"
            >
              {c.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Section Name (A,B,C)"
          value={sectionName}
          onChange={(e)=>setSectionName(e.target.value)}
          className="w-full p-3 mb-4 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-white/30"
        />

        <button
          onClick={addSection}
          className="px-5 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition"
        >
          Add Section
        </button>

      </div>

      {/* TABLE */}
      <div className="bg-white/10 p-6 rounded-xl backdrop-blur-md border border-white/10">

        <table className="w-full text-sm border border-white/10 text-white">

          <thead>
            <tr>
              <th className="border border-white/10 p-3 text-left">Class</th>
              <th className="border border-white/10 p-3 text-left">Sections</th>
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
                  <td className="border border-white/10 p-3">{c.name}</td>
                  <td className="border border-white/10 p-3">{sec || "-"}</td>
                </tr>
              )
            })}

          </tbody>

        </table>

      </div>

    </div>

  )
}