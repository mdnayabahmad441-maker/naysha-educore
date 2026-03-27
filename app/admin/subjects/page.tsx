"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { dbGet, dbInsert, dbDelete } from "@/lib/db"

export default function SubjectsPage() {

  const [subjects,setSubjects] = useState<any[]>([])
  const [classes,setClasses] = useState<any[]>([])

  const [selectedClass,setSelectedClass] = useState("")
  const [subjectInputs,setSubjectInputs] = useState<string[]>([""])

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

  // ➕ ADD NEW INPUT FIELD
  const addField = () => {
    setSubjectInputs(prev => [...prev, ""])
  }

  // ❌ REMOVE FIELD
  const removeField = (index:number) => {
    const updated = [...subjectInputs]
    updated.splice(index,1)
    setSubjectInputs(updated)
  }

  // ✏️ UPDATE FIELD
  const updateField = (value:string, index:number) => {
    const updated = [...subjectInputs]
    updated[index] = value
    setSubjectInputs(updated)
  }

  // 💾 SAVE ALL SUBJECTS
  const submit = async () => {

    if(!selectedClass){
      alert("Select class")
      return
    }

    const filtered = subjectInputs.filter(s => s.trim() !== "")

    if(filtered.length === 0){
      alert("Enter at least one subject")
      return
    }

    // 🔥 INSERT MULTIPLE
    for (const name of filtered){

      await dbInsert("subjects", {
        id: crypto.randomUUID(),
        name,
        class_id: selectedClass
      })

    }

    // RESET
    setSubjectInputs([""])
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

        {/* CLASS SELECT */}
        <div className="mb-6">
          <select
            value={selectedClass}
            onChange={(e)=>setSelectedClass(e.target.value)}
            className="bg-[#0b1220] border border-white/10 p-3 rounded-xl text-white w-full"
          >
            <option value="">Select Class</option>

            {classes.map(c=>(
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* 🔥 MULTIPLE SUBJECT INPUTS */}
        <div className="space-y-3 mb-6">

          {subjectInputs.map((val,index)=>(
            <div key={index} className="flex gap-3">

              <Input
                placeholder={`Subject ${index+1}`}
                value={val}
                onChange={(e)=>updateField(e.target.value,index)}
              />

              {subjectInputs.length > 1 && (
                <button
                  onClick={()=>removeField(index)}
                  className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl"
                >
                  ✕
                </button>
              )}

            </div>
          ))}

          {/* ADD MORE */}
          <button
            onClick={addField}
            className="text-blue-400 text-sm"
          >
            + Add Another Subject
          </button>

        </div>

        {/* SAVE BUTTON */}
        <Button onClick={submit}>
          Save All Subjects
        </Button>

        {/* TABLE */}
        <div className="overflow-x-auto mt-8">

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