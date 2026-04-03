"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { dbInsert } from "@/lib/db"
import { getSchoolId } from "@/lib/school"
import { getActiveAcademicYear } from "@/lib/academic"

export default function StudentForm({ reload }: any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [roll,setRoll] = useState("")
  const [photo,setPhoto] = useState<File | null>(null)

  const [classes,setClasses] = useState<any[]>([])
  const [selectedClass,setSelectedClass] = useState("")

  const [loading,setLoading] = useState(false)

  const [parentName,setParentName] = useState("")
  const [parentEmail,setParentEmail] = useState("")
  const [parentPhone,setParentPhone] = useState("")

  const [schoolId,setSchoolId] = useState<string | null>(null)

  // ================= LOAD SCHOOL =================
  useEffect(()=>{
    getSchoolId().then(setSchoolId)
  },[])

  // ================= LOAD CLASSES =================
  useEffect(()=>{
    const load = async ()=>{
      if(!schoolId) return

      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", schoolId)

      setClasses(data || [])
    }

    load()
  },[schoolId])

  // ================= GENERATE STUDENT CODE =================
  const generateStudentCode = async ()=>{
    const { count } = await supabase
      .from("students")
      .select("*",{count:"exact", head:true})
      .eq("school_id", schoolId)

    const next = (count || 0) + 1

    return `ST${String(next).padStart(2,"0")}`
  }

  // ================= SAVE =================
  const save = async ()=>{

    try{

      if(!name || !selectedClass){
        alert("Fill required fields")
        return
      }

      if(!schoolId){
        alert("School not found")
        return
      }

      setLoading(true)

      let photoUrl = ""

      // 📸 UPLOAD PHOTO
      if(photo){
        const fileName = `${Date.now()}-${photo.name}`

        const { error } = await supabase.storage
          .from("students")
          .upload(fileName, photo)

        if(error){
          alert("Image upload failed")
          return
        }

        photoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/students/${fileName}`
      }

      const studentId = crypto.randomUUID()

      // 🔥 GENERATE CODE
      const studentCode = await generateStudentCode()

      // ================= CREATE STUDENT =================
      await dbInsert("students", {
        id: studentId,
        school_id: schoolId,
        name: name.trim(),
        email: email.trim() || null,
        photo: photoUrl,
        student_code: studentCode
      })

      // ================= ENROLLMENT =================
      const year = await getActiveAcademicYear()

      if(!year){
        alert("No active academic year")
        return
      }

      await dbInsert("student_enrollments", {
        id: crypto.randomUUID(),
        student_id: studentId,
        class_id: selectedClass,
        school_id: schoolId,
        academic_year_id: year.id,
        roll_number: roll || null
      })

      // ================= PARENT =================
      if(parentName || parentEmail){
        await dbInsert("parents", {
          id: crypto.randomUUID(),
          school_id: schoolId,
          student_id: studentId,
          name: parentName || null,
          email: parentEmail || null,
          phone: parentPhone || null
        })
      }

      // ================= RESET =================
      setName("")
      setEmail("")
      setRoll("")
      setPhoto(null)
      setSelectedClass("")
      setParentName("")
      setParentEmail("")
      setParentPhone("")

      alert(`Student Created ✅ (${studentCode})`)

      if(reload) await reload()

    }catch(err){
      console.error("Student create error:", err)
      alert("Something went wrong")
    }finally{
      setLoading(false)
    }
  }

  return(

    <div className="space-y-6">

      {/* STUDENT */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold">Student Details</h2>

        <div className="grid md:grid-cols-2 gap-4">

          <input
            placeholder="Student Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

          <input
            placeholder="Student Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

          <input
            placeholder="Roll Number"
            value={roll}
            onChange={(e)=>setRoll(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e)=>setPhoto(e.target.files?.[0] || null)}
            className="text-sm text-gray-300"
          />

          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          >
            <option value="">Select Class</option>
            {classes.map(c=>(
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

        </div>

      </div>

      {/* PARENT */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">

        <h2 className="text-lg font-semibold">Parent Details</h2>

        <div className="grid md:grid-cols-3 gap-4">

          <input
            placeholder="Parent Name"
            value={parentName}
            onChange={(e)=>setParentName(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

          <input
            placeholder="Parent Email"
            value={parentEmail}
            onChange={(e)=>setParentEmail(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

          <input
            placeholder="Parent Phone"
            value={parentPhone}
            onChange={(e)=>setParentPhone(e.target.value)}
            className="px-4 py-3 rounded-xl bg-[#0b1220] border border-white/10 text-white"
          />

        </div>

      </div>

      {/* BUTTON */}
      <div className="flex justify-end">

        <button
          onClick={save}
          disabled={loading}
          className="px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600"
        >
          {loading ? "Saving..." : "Save Student"}
        </button>

      </div>

    </div>
  )
}