"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { createSection, getSections } from "@/services/sections.service"

export default function SectionsPage() {

  const [sections, setSections] = useState<any[]>([])
  const [name, setName] = useState("")

  const load = async () => {

    const data = await getSections()
    setSections(data)

  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {

    if (!name) return

    await createSection({
      id: crypto.randomUUID(),
      name
    })

    setName("")
    load()

  }

  return (

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Sections</h1>

      <Card>

        <div className="flex gap-4 mb-6">

          <Input
            placeholder="Section Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <Button color="green" onClick={submit}>
            Save
          </Button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border border-white/20">

            <thead>
              <tr>
                <th className="border p-2">Section</th>
              </tr>
            </thead>

            <tbody>

              {sections.map((s)=>(
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