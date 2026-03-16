"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import { createClass, getClasses } from "@/services/classes.service"
import { useAuth } from "@/hooks/useAuth"
import { useSchool } from "@/hooks/useSchool"

export default function ClassesPage() {

  const { user } = useAuth()
  const schoolId = useSchool(user?.id)

  const [classes,setClasses] = useState<any[]>([])
  const [name,setName] = useState("")

  const load = async () => {

    const data = await getClasses()
    setClasses(data)

  }

  useEffect(() => {

    if (schoolId) load()

  },[schoolId])

  const submit = async () => {

    await createClass({
      id: crypto.randomUUID(),
      school_id: schoolId,
      name
    })

    setName("")
    load()

  }

  return (

    <div className="space-y-6">

      <h1 className="text-2xl">Classes</h1>

      <Card>

        <div className="flex gap-4 mb-6">

          <Input
          placeholder="Class Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
          />

          <Button color="green" onClick={submit}>
            Save
          </Button>

        </div>

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">Class</th>
            </tr>
          </thead>

          <tbody>

            {classes.map((c)=>(
              <tr key={c.id}>
                <td className="border p-2">{c.name}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </Card>

    </div>

  )

}