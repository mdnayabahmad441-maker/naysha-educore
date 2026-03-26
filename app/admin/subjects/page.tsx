"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { dbGet, dbInsert, dbDelete } from "@/lib/db"

export default function SubjectsPage() {

  const [subjects,setSubjects] = useState<any[]>([])
  const [classes,setClasses] = useState<any[]>([])

  const [name,setName] = useState("")
  const [selectedClass,setSelectedClass] = useState("")

  // LOAD DATA
  const load = async () => {

    const sub = await dbGet("subjects")
    const cls = await dbGet("classes")

    setSubjects(sub || [])
    setClasses(cls || [])
  }

  useEffect(()=>{
    load()
  },[])

  // ADD SUBJECT
  const submit = async () => {

    if(!name || !selectedClass){
      alert("Enter subject + select class")
      return
    }

    await dbInsert("subjects", {
      id: crypto.randomUUID(),
      name,
      class_id: selectedClass
    })

    setName("")
    setSelectedClass("")
    load()
  }

  // 🗑 DELETE SUBJECT
  const remove = async (id:string) => {

    const confirmDelete = confirm("Delete this subject?")

    if(!confirmDelete) return

    await dbDelete("subjects", id)

    load()
  }

  return (

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Subjects</h1>

      <Card>

        <div className="flex gap-4 mb-6 flex-wrap">

          {/* CLASS SELECT */}
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="bg-[#0b1220] border border-white/10 p-3 rounded-xl text-white"
          >
            <option value="">Select Class</option>

            {classes.map(c=>(
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

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
                <th className="border p-2 text-left">Class</th>
                <th className="border p-2 text-left">Subject</th>
                <th className="border p-2 text-left">Action</th>
              </tr>
            </thead>

            <tbody>

              {subjects.map((s)=>{

                const cls = classes.find(c=>c.id === s.class_id)

                return(
                  <tr key={s.id}>
                    <td className="border p-2">{cls?.name || "-"}</td>
                    <td className="border p-2">{s.name}</td>

                    <td className="border p-2">
                      <button
                        onClick={()=>remove(s.id)}
                        className="px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                )
              })}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  )

}