"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function StudentForm({ reload }: any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [classes,setClasses] = useState<any[]>([])
  const [selectedClass,setSelectedClass] = useState("")

  const loadClasses = async () => {

    const schoolId = await getSchoolId()

    console.log("StudentForm schoolId:", schoolId)

    if (!schoolId) return

    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    console.log("StudentForm classes:", data)

    if(error){
      console.error(error)
      return
    }

    setClasses(data || [])
  }

  useEffect(()=>{
    loadClasses()
  },[])

  const save = async () => {

    const schoolId = await getSchoolId()

    await supabase.from("students").insert([
      {
        id: crypto.randomUUID(),
        name,
        email,
        class_id: selectedClass,
        school_id: schoolId
      }
    ])

    setName("")
    setEmail("")
    setSelectedClass("")

    reload()
  }

  return(

    <div className="flex gap-4">

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

      <select
        value={selectedClass}
        onChange={(e)=>setSelectedClass(e.target.value)}
        className="p-2 bg-gray-800 rounded"
      >
        <option value="">Select Class</option>

        {classes.map(c=>(
          <option key={c.id} value={c.id}>
            {c.name}
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