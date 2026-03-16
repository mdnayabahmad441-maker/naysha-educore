"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import Button from "@/components/ui/Button"
import { createTeacher, getTeachers } from "@/services/teachers.service"

export default function TeachersPage(){

  const [teachers,setTeachers] = useState<any[]>([])

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")

  const load = async () => {

    const data = await getTeachers()
    setTeachers(data)

  }

  useEffect(()=>{
    load()
  },[])

  const submit = async () => {

    if(!name || !email || !phone) return

    await createTeacher({
      id: crypto.randomUUID(),
      name,
      email,
      phone
    })

    setName("")
    setEmail("")
    setPhone("")

    load()

  }

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">
        Teachers
      </h1>

      <Card>

        <div className="flex flex-wrap gap-4 mb-6">

          <input
            className="bg-slate-800 border border-white/20 p-2 rounded"
            placeholder="Teacher Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
          />

          <input
            className="bg-slate-800 border border-white/20 p-2 rounded"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input
            className="bg-slate-800 border border-white/20 p-2 rounded"
            placeholder="Phone"
            value={phone}
            onChange={(e)=>setPhone(e.target.value)}
          />

          <Button color="green" onClick={submit}>
            Save
          </Button>

        </div>

        <table className="w-full text-sm border border-white/20">

          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Phone</th>
            </tr>
          </thead>

          <tbody>

            {teachers.map((t)=>(
              <tr key={t.id}>
                <td className="border p-2">{t.name}</td>
                <td className="border p-2">{t.email}</td>
                <td className="border p-2">{t.phone}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </Card>

    </div>

  )

}