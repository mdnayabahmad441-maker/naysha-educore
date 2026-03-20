"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export default function StudentForm({ reload }: any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [roll,setRoll] = useState("")

  const [photo,setPhoto] = useState<File | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [selectedSection,setSelectedSection] = useState("")

  const [schoolId,setSchoolId] = useState<string | null>(null)
  const [loading,setLoading] = useState(false)

  // ✅ GET SCHOOL
  useEffect(()=>{
    const init = async ()=>{
      const id = await getSchoolId()
      setSchoolId(id)
    }
    init()
  },[])

  // ✅ LOAD DATA
  useEffect(()=>{
    if(!schoolId) return
    loadClasses()
    loadSections()
  },[schoolId])

  const loadClasses = async ()=>{
    const { data } = await supabase
      .from("classes")
      .select("*")
      .eq("school_id", schoolId)

    setClasses(data || [])
  }

  const loadSections = async ()=>{
    const { data } = await supabase
      .from("sections")
      .select("*")
      .eq("school_id", schoolId)

    setSections(data || [])
  }

  const filteredSections = sections.filter(
    (s)=>s.class_id === selectedClass
  )

  // ✅ SAVE STUDENT (FINAL FIXED)
  const save = async ()=>{

    try{

      if(!schoolId){
        alert("School not found")
        return
      }

      if(!name || !email || !selectedClass || !selectedSection){
        alert("Fill all fields")
        return
      }

      setLoading(true)

      let photoUrl = ""

      // 🔥 UPLOAD IMAGE
      if(photo){
        const fileName = `${Date.now()}-${photo.name}`

        const { error: uploadError } = await supabase.storage
          .from("students")
          .upload(fileName, photo)

        if(uploadError){
          console.error(uploadError)
          alert("Image upload failed")
          setLoading(false)
          return
        }

        photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/students/${fileName}`
      }

      // 🔥 INSERT
      const { error } = await supabase
        .from("students")
        .insert([
          {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: email.trim(),
            roll_number: roll,
            class_id: selectedClass,
            section_id: selectedSection,
            school_id: schoolId,
            photo: photoUrl
          }
        ])

      if(error){
        console.error(error)
        alert(error.message)
        return
      }

      // RESET
      setName("")
      setEmail("")
      setRoll("")
      setPhoto(null)
      setSelectedClass("")
      setSelectedSection("")

      if(reload) await reload()

    }catch(err){
      console.error(err)
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="flex flex-wrap gap-4 items-center">

      {/* NAME */}
      <input
        placeholder="Student Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* EMAIL */}
      <input
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* ROLL */}
      <input
        placeholder="Roll Number"
        value={roll}
        onChange={(e)=>setRoll(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* PHOTO */}
      <input
        type="file"
        accept="image/*"
        onChange={(e)=>setPhoto(e.target.files?.[0] || null)}
        className="text-white text-sm"
      />

      {/* CLASS */}
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
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* SECTION */}
      <select
        value={selectedSection}
        onChange={(e)=>setSelectedSection(e.target.value)}
        className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
      >
        <option value="">Select Section</option>

        {filteredSections.map(s=>(
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* BUTTON */}
      <button
        onClick={save}
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 backdrop-blur-md hover:bg-white/20 transition text-white font-medium disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save"}
      </button>

    </div>
  )
}