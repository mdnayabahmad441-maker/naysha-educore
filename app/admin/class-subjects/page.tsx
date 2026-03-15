"use client"

import { useEffect,useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { supabase } from "@/lib/supabase"
import { createClassSubject, getClassSubjects } from "@/services/classSubjects.service"

export default function ClassSubjectsPage(){

  const [classes,setClasses] = useState<any[]>([])
  const [subjects,setSubjects] = useState<any[]>([])
  const [data,setData] = useState<any[]>([])

  const [classId,setClassId] = useState("")
  const [subjectId,setSubjectId] = useState("")

  const load = async()=>{

    const {data:cls} = await supabase.from("classes").select("*")
    const {data:sub} = await supabase.from("subjects").select("*")

    const mapping = await getClassSubjects()

    setClasses(cls || [])
    setSubjects(sub || [])
    setData(mapping)

  }

  useEffect(()=>{
    load()
  },[])

  const submit = async()=>{

    if(!classId || !subjectId) return

    await createClassSubject({
      id:crypto.randomUUID(),
      class_id:classId,
      subject_id:subjectId
    })

    load()

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Class Subjects</h1>

      <Card>

        <div className="flex gap-4 mb-6">

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
          onChange={(e)=>setSubjectId(e.target.value)}
          >
            <option>Select Subject</option>

            {subjects.map(s=>(
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}

          </select>

          <Button color="green" onClick={submit}>
            Save
          </Button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border border-white/20">

            <thead>
              <tr>
                <th className="border p-2">Class</th>
                <th className="border p-2">Subject</th>
              </tr>
            </thead>

            <tbody>

              {data.map((row:any)=>(
                <tr key={row.id}>
                  <td className="border p-2">{row.classes?.name}</td>
                  <td className="border p-2">{row.subjects?.name}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  )

}