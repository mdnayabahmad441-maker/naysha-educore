"use client"

import { useEffect, useState } from "react"
import Card from "@/components/ui/Card"
import StudentForm from "@/components/students/StudentForm"
import { getStudents } from "@/services/students.service"
import { useAuth } from "@/hooks/useAuth"

export default function StudentsPage(){

  const { user } = useAuth()

  const [students,setStudents] = useState<any[]>([])

  const load = async () => {

    if(!user?.school_id) return

    const data = await getStudents(user.school_id)
    setStudents(data)

  }

  useEffect(()=>{
    load()
  },[user])

  return(
    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Students</h1>

      <Card>

        <StudentForm reload={load}/>

        <table className="w-full text-sm border border-white/20 mt-6">

          <thead>
            <tr>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
            </tr>
          </thead>

          <tbody>

            {students.map(s=>(
              <tr key={s.id}>
                <td className="border p-2">{s.name}</td>
                <td className="border p-2">{s.email}</td>
              </tr>
            ))}

          </tbody>

        </table>

      </Card>

    </div>
  )

}