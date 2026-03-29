"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbGet, dbInsert } from "@/lib/db"
import { getSchoolId } from "@/lib/school" // ✅ ADDED

export default function StudentForm({ reload }: any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [roll,setRoll] = useState("")
  const [photo,setPhoto] = useState<File | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")

  const [loading,setLoading] = useState(false)

  const [parentName,setParentName] = useState("")
  const [parentEmail,setParentEmail] = useState("")
  const [parentPhone,setParentPhone] = useState("")

  const [schoolId,setSchoolId] = useState<string | null>(null) // ✅ ADDED

  // ================= LOAD SCHOOL =================
  useEffect(()=>{
  const id = getSchoolId()
  if (id) setSchoolId(id)
},[])
  // ================= LOAD DATA (SECURE) =================
 useEffect(()=>{
  const load = async ()=>{
    if(!schoolId) return // ✅ correct

    const { data: cls } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    const { data: sec } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)

    setClasses(cls || [])
    setSections(sec || [])
  }

  load()
},[schoolId])

  const filteredSections = sections.filter(
    (s)=>s.class_id === selectedClass
  )

  const save = async ()=>{

    try{

      if(!name || !email || !selectedClass || !selectedSection){
        alert("Fill all fields")
        return
      }

      if(!schoolId){
        alert("School not found")
        return
      }

      setLoading(true)

      let photoUrl = ""

      if(photo){
        const fileName = `${Date.now()}-${photo.name}`

        const { error: uploadError } = await supabase.storage
          .from("students")
          .upload(fileName, photo)

        if(uploadError){
          alert("Image upload failed")
          return
        }

        photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/students/${fileName}`
      }

      const studentId = crypto.randomUUID()

      // ================= STUDENT INSERT (FIXED) =================
      await dbInsert("students", {
        id: studentId,
        school_id: schoolId, // ✅ CRITICAL FIX
        name: name.trim(),
        email: email.trim(),
        roll_number: roll,
        class_id: selectedClass,
        section_id: selectedSection,
        photo: photoUrl
      })

      // ================= PARENT INSERT (FIXED) =================
      if(parentEmail){
        await dbInsert("parents", {
          id: crypto.randomUUID(),
          school_id: schoolId, // ✅ CRITICAL FIX
          student_id: studentId,
          name: parentName,
          email: parentEmail.trim(),
          phone: parentPhone
        })
      }

      // RESET
      setName("")
      setEmail("")
      setRoll("")
      setPhoto(null)
      setSelectedClass("")
      setSelectedSection("")
      setParentName("")
      setParentEmail("")
      setParentPhone("")

      if(reload) await reload()

    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="space-y-6">

      {/* ================= STUDENT SECTION ================= */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold">Student Details</h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Student Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            placeholder="Student Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            placeholder="Roll Number"
            value={roll}
            onChange={(e)=>setRoll(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />

          <input
            type="file"
            accept="image/*"
            onChange={(e)=>setPhoto(e.target.files?.[0] || null)}
            className="text-sm text-gray-300"
          />

          <select
            value={selectedClass}
            onChange={(e)=>{
              setSelectedClass(e.target.value)
              setSelectedSection("")
            }}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={selectedSection}
            onChange={(e)=>setSelectedSection(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          >
            <option value="">Select Section</option>
            {filteredSections.map(s=>(
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

        </div>

      </div>

      {/* ================= PARENT SECTION ================= */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold">Parent Details</h2>

        <div className="grid md:grid-cols-3 gap-4">

          <input
            placeholder="Parent Name"
            value={parentName}
            onChange={(e)=>setParentName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />

          <input
            placeholder="Parent Email (for login)"
            value={parentEmail}
            onChange={(e)=>setParentEmail(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />

          <input
            placeholder="Parent Phone"
            value={parentPhone}
            onChange={(e)=>setParentPhone(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />

        </div>

      </div>

      {/* BUTTON */}
      <div className="flex justify-end">

        <button
          onClick={save}
          disabled={loading}
          className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition text-white"
        >
          {loading ? "Saving..." : "Save Student"}
        </button>

      </div>

    </div>
  )
}