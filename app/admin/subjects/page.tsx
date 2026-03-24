"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { dbGet, dbInsert } from "@/lib/db"

export default function SubjectsPage() {

  const [subjects,setSubjects] = useState<any[]>([])
  const [name,setName] = useState("")

  // LOAD SUBJECTS (MULTI-TENANT SAFE)
  const load = async () => {

    const data = await dbGet("subjects")
    setSubjects(data || [])

  }

  useEffect(()=>{
    load()
  },[])

  // ADD SUBJECT
  const submit = async () => {

    if(!name) return

    await dbInsert("subjects", {
      id: crypto.randomUUID(),
      name
    })

    setName("")
    load()

  }

  return (

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Subjects</h1>

      <Card>

        <div className="flex gap-4 mb-6">

          <Input
            placeholder="Subject Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <Button onClick={submit}>
            Save
          </Button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border border-white/20">

            <thead>
              <tr>
                <th className="border p-2 text-left">Subject</th>
              </tr>
            </thead>

            <tbody>

              {subjects.map((s)=>(
                <tr key={s.id}>
                  <td className="border p-2">{s.name}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  )

}