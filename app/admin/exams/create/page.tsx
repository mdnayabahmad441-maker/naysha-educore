"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import Button from "@/components/ui/Button"
import { createExam } from "@/services/exams.service"

export default function CreateExam(){

  const [name,setName] = useState("")
  const [date,setDate] = useState("")
  const [classId,setClassId] = useState("")

  const [classes,setClasses] = useState<any[]>([])

  useEffect(()=>{

    const load = async()=>{

      const {data}=await supabase
        .from("classes")
        .select("*")

      setClasses(data||[])

    }

    load()

  },[])

  const submit = async()=>{

    await createExam({
      id:crypto.randomUUID(),
      name,
      exam_date:date,
      class_id:classId
    })

    setName("")
    setDate("")
    setClassId("")

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Create Exam</h1>

      <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6 flex gap-4">

        <input
        className="bg-slate-800 border border-white/20 p-2 rounded"
        placeholder="Exam Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
        />

        <input
        type="date"
        className="bg-slate-800 border border-white/20 p-2 rounded"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
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

        <Button color="purple" onClick={submit}>
          Create
        </Button>

      </div>

    </div>

  )

}