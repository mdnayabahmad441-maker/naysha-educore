"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"

export default function StudentForm({onSaved}:any){

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [classId,setClassId] = useState("")
  const [sectionId,setSectionId] = useState("")

  const [classes,setClasses] = useState<any[]>([])
  const [sections,setSections] = useState<any[]>([])

  useEffect(()=>{

    const load = async()=>{

      const {data:c}=await supabase.from("classes").select("*")
      const {data:s}=await supabase.from("sections").select("*")

      setClasses(c||[])
      setSections(s||[])

    }

    load()

  },[])

  const submit = async()=>{

    const {error}=await supabase
      .from("students")
      .insert({
        id:crypto.randomUUID(),
        name,
        email,
        class_id:classId,
        section_id:sectionId
      })

    if(error) console.error(error)

    setName("")
    setEmail("")
    setClassId("")
    setSectionId("")

    onSaved()

  }

  return(

    <div className="flex gap-4 mb-6">

      <input
      className="bg-slate-800 border border-white/20 p-2 rounded"
      placeholder="Student Name"
      value={name}
      onChange={(e)=>setName(e.target.value)}
      />

      <input
      className="bg-slate-800 border border-white/20 p-2 rounded"
      placeholder="Email"
      value={email}
      onChange={(e)=>setEmail(e.target.value)}
      />

      <select
      className="bg-slate-800 border border-white/20 p-2 rounded"
      onChange={(e)=>setClassId(e.target.value)}
      >
        <option>Select Class</option>

        {classes.map(c=>(
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}

      </select>

      <select
      className="bg-slate-800 border border-white/20 p-2 rounded"
      onChange={(e)=>setSectionId(e.target.value)}
      >
        <option>Select Section</option>

        {sections.map(s=>(
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}

      </select>

      <Button color="green" onClick={submit}>
        Save
      </Button>

    </div>

  )

}