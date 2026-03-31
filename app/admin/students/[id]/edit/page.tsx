"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams, useRouter } from "next/navigation"
import { getUserRole } from "@/lib/getUserRole"
import { getSchoolId } from "@/lib/school"

export default function EditStudentPage(){

  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id

  const router = useRouter()

  const [loading,setLoading] = useState(true)

  const [form,setForm] = useState({
    name:"",
    email:"",
    roll:"",
    class_id:"",
    parentEmail:"",
    parentPhone:"",
    father_name:"",
    mother_name:""
  })

  const [classes,setClasses] = useState<any[]>([])
  const [parentId,setParentId] = useState<string | null>(null)

  // 🔐 ROLE PROTECTION
  useEffect(()=>{
    const check = async()=>{
      const role = await getUserRole()

      if(role?.role !== "admin"){
        router.replace("/unauthorized")
      }
    }
    check()
  },[router])

  // 🔥 LOAD DATA
  useEffect(()=>{

    const load = async()=>{

      try{

        const [studentRes, parentRes, classRes] = await Promise.all([

          supabase
            .from("students")
            .select("*")
            .eq("id",id)
            .single(),

          supabase
            .from("parents")
            .select("*")
            .eq("student_id",id)
            .maybeSingle(),

          supabase
            .from("classes")
            .select("*")
        ])

        const student = studentRes.data
        const parent = parentRes.data

        setClasses(classRes.data || [])

        if(student){
          setForm({
            name: student.name || "",
            email: student.email || "",
            roll: student.roll_number || "",
            class_id: student.class_id || "",
            parentEmail: parent?.email || "",
            parentPhone: parent?.phone || "",
            father_name: parent?.father_name || "",
            mother_name: parent?.mother_name || ""
          })
        }

        if(parent){
          setParentId(parent.id)
        }

      }catch(err){
        console.error("LOAD ERROR:", err)
      }finally{
        setLoading(false)
      }
    }

    load()

  },[id])

  const updateField = (key:string,value:any)=>{
    setForm(prev=>({...prev,[key]:value}))
  }

  // 💾 SAVE
  const save = async ()=>{

    if(!form.name){
      alert("Student name required")
      return
    }

    if(!form.class_id){
      alert("Select class")
      return
    }

    setLoading(true)

    const schoolId = await getSchoolId()

    if(!schoolId){
      alert("School not found")
      setLoading(false)
      return
    }

    // ✅ UPDATE STUDENT
    const { error: studentError } = await supabase
      .from("students")
      .update({
        name: form.name,
        email: form.email || null,
        roll_number: form.roll ? Number(form.roll) : null,
        class_id: form.class_id
      })
      .eq("id",id)
      .eq("school_id", schoolId)

    if(studentError){
      console.error(studentError)
      alert(studentError.message)
      setLoading(false)
      return
    }

    // ✅ PARENT SAVE
    const parentPayload = {
      student_id: id,
      school_id: schoolId,
      email: form.parentEmail || null,
      phone: form.parentPhone || null,
      father_name: form.father_name || null,
      mother_name: form.mother_name || null
    }

    if(parentId){
      const { error } = await supabase
        .from("parents")
        .update(parentPayload)
        .eq("id", parentId)
        .eq("school_id", schoolId)

      if(error){
        console.error(error)
        alert(error.message)
        setLoading(false)
        return
      }

    } else {
      const { error } = await supabase
        .from("parents")
        .insert({
          id: crypto.randomUUID(),
          ...parentPayload
        })

      if(error){
        console.error(error)
        alert(error.message)
        setLoading(false)
        return
      }
    }

    alert("Updated successfully ✅")
    router.push(`/admin/students/${id}`)
  }

  // ================= UI =================
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
        <input
          value={form.name}
          onChange={(e)=>updateField("name",e.target.value)}
          placeholder="Student Name"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          value={form.email}
          onChange={(e)=>updateField("email",e.target.value)}
          placeholder="Student Email"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          value={form.roll}
          onChange={(e)=>updateField("roll",e.target.value)}
          placeholder="Roll Number"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        {/* CLASS */}
        <select
          value={form.class_id}
          onChange={(e)=>updateField("class_id",e.target.value)}
          className="w-full p-3 rounded bg-[#0b1220]"
        >
          <option value="">Select Class</option>
          {classes.map(c=>(
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* PARENTS */}
        <input
          value={form.father_name}
          onChange={(e)=>updateField("father_name",e.target.value)}
          placeholder="Father Name"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          value={form.mother_name}
          onChange={(e)=>updateField("mother_name",e.target.value)}
          placeholder="Mother Name"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          value={form.parentEmail}
          onChange={(e)=>updateField("parentEmail",e.target.value)}
          placeholder="Parent Email"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        <input
          value={form.parentPhone}
          onChange={(e)=>updateField("parentPhone",e.target.value)}
          placeholder="Parent Phone"
          className="w-full p-3 rounded bg-[#0b1220]"
        />

        {/* ACTIONS */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={save}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded"
          >
            Save Changes
          </button>

          <button
            onClick={()=>router.push(`/admin/students/${id}`)}
            className="px-6 py-3 bg-white/10 rounded"
          >
            Cancel
          </button>
        </div>

      </div>

    </div>
  )
}