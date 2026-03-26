"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"

export default function EditStudentPage(){

  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id // ✅ FIX

  const router = useRouter()

  const [loading,setLoading] = useState(true)

  const [form,setForm] = useState({
    name:"",
    email:"",
    roll:"",
    class_id:"",
    section_id:"",
    parentName:"",
    parentEmail:"",
    parentPhone:"",
    father_name:"", // ✅ NEW
    mother_name:""  // ✅ NEW
  })

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  const [parentId,setParentId] = useState<string | null>(null)

  // 🔐 ROLE PROTECTION
  useEffect(()=>{
    const check = async()=>{
      const role = await getUserRole()

      if(role?.role !== "admin"){
        window.location.href = "/unauthorized"
      }
    }

    check()
  },[])

  // 🔥 LOAD DATA
  useEffect(()=>{

    const load = async()=>{

      const { data:student } = await supabase
        .from("students")
        .select("*")
        .eq("id",id)
        .single()

      const { data:parent } = await supabase
        .from("parents")
        .select("*")
        .eq("student_id",id)
        .maybeSingle()

      const { data:cls } = await supabase.from("classes").select("*")
      const { data:sec } = await supabase.from("sections").select("*")

      setClasses(cls || [])
      setSections(sec || [])

      if(student){
        setForm({
          name: student.name || "",
          email: student.email || "",
          roll: student.roll_number || "",
          class_id: student.class_id || "",
          section_id: student.section_id || "",
          parentName: parent?.name || "",
          parentEmail: parent?.email || "",
          parentPhone: parent?.phone || "",
          father_name: parent?.father_name || "", // ✅
          mother_name: parent?.mother_name || ""  // ✅
        })
      }

      if(parent){
        setParentId(parent.id)
      }

      setLoading(false)
    }

    load()

  },[id])

  const updateField = (key:string,value:any)=>{
    setForm(prev=>({...prev,[key]:value}))
  }

  const filteredSections = sections.filter(
    (s)=>s.class_id === form.class_id
  )

  // 💾 SAVE (🔥 REAL FIX)
  const save = async ()=>{

    if(!form.name || !form.email){
      alert("Fill required fields")
      return
    }

    setLoading(true)

    const schoolId = await getSchoolId()

    // ✅ UPDATE STUDENT (FIXED WITH SCHOOL ID)
    const { error: studentError } = await supabase
      .from("students")
      .update({
        name: form.name,
        email: form.email,
        roll_number: form.roll,
        class_id: form.class_id,
        section_id: form.section_id
      })
      .eq("id",id)
      .eq("school_id", schoolId) // 🔥 CRITICAL FIX

    if(studentError){
      console.error(studentError)
      alert(studentError.message)
      setLoading(false)
      return
    }

    // ✅ UPSERT PARENT (FIXED)
    const { error: parentError } = await supabase
      .from("parents")
      .upsert(
        [
          {
            student_id: id,
            school_id: schoolId,
            name: form.parentName,
            email: form.parentEmail,
            phone: form.parentPhone,
            father_name: form.father_name, // ✅
            mother_name: form.mother_name  // ✅
          }
        ],
        {
          onConflict: "student_id"
        }
      )

    if(parentError){
      console.error(parentError)
      alert(parentError.message)
      setLoading(false)
      return
    }

    alert("Updated successfully ✅")

    router.push(`/admin/students/${id}`)
  }

  if(loading){
    return <div className="p-10 text-white">Loading...</div>
  }

  return(

    <div className="p-6 md:p-10 text-white max-w-5xl mx-auto space-y-6">

      <h1 className="text-2xl font-semibold">
        Edit Student
      </h1>

      <div className="bg-white/10 border border-white/10 p-6 rounded-xl space-y-4">

        {/* STUDENT */}
        <input value={form.name} onChange={(e)=>updateField("name",e.target.value)} placeholder="Student Name" className="w-full p-3 rounded bg-[#0b1220]" />
        <input value={form.email} onChange={(e)=>updateField("email",e.target.value)} placeholder="Student Email" className="w-full p-3 rounded bg-[#0b1220]" />
        <input value={form.roll} onChange={(e)=>updateField("roll",e.target.value)} placeholder="Roll Number" className="w-full p-3 rounded bg-[#0b1220]" />

        {/* CLASS */}
        <select value={form.class_id} onChange={(e)=>{updateField("class_id",e.target.value);updateField("section_id","")}} className="w-full p-3 rounded bg-[#0b1220]">
          <option value="">Select Class</option>
          {classes.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>

        {/* SECTION */}
        <select value={form.section_id} onChange={(e)=>updateField("section_id",e.target.value)} className="w-full p-3 rounded bg-[#0b1220]">
          <option value="">Select Section</option>
          {filteredSections.map(s=>(<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>

        {/* PARENT */}
        <input value={form.parentName} onChange={(e)=>updateField("parentName",e.target.value)} placeholder="Parent Name" className="w-full p-3 rounded bg-[#0b1220]" />

        {/* ✅ NEW FIELDS */}
        <input value={form.father_name} onChange={(e)=>updateField("father_name",e.target.value)} placeholder="Father Name" className="w-full p-3 rounded bg-[#0b1220]" />
        <input value={form.mother_name} onChange={(e)=>updateField("mother_name",e.target.value)} placeholder="Mother Name" className="w-full p-3 rounded bg-[#0b1220]" />

        <input value={form.parentEmail} onChange={(e)=>updateField("parentEmail",e.target.value)} placeholder="Parent Email" className="w-full p-3 rounded bg-[#0b1220]" />
        <input value={form.parentPhone} onChange={(e)=>updateField("parentPhone",e.target.value)} placeholder="Parent Phone" className="w-full p-3 rounded bg-[#0b1220]" />

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4">

          <button onClick={save} className="px-6 py-3 bg-green-600 rounded">
            Save Changes
          </button>

          <button onClick={()=>router.push(`/admin/students/${id}`)} className="px-6 py-3 bg-white/10 rounded">
            Cancel
          </button>

        </div>

      </div>

    </div>
  )
}