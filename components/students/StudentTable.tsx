"use client"

import { useEffect,useState } from "react"
import Table from "@/components/ui/Table"
import { getStudents } from "@/services/students.service"
import { useAuth } from "@/hooks/useAuth"
import { useSchool } from "@/hooks/useSchool"

export default function StudentTable(){

  const { user } = useAuth()
  const schoolId = useSchool(user?.id)

  const [students,setStudents] = useState<any[]>([])

  useEffect(()=>{

    if(!schoolId) return

    const load = async()=>{
      const data = await getStudents(schoolId)
      setStudents(data)
    }

    load()

  },[schoolId])

  return(

    <Table>

      <thead>
        <tr>
          <th className="border p-2">Name</th>
          <th className="border p-2">Email</th>
          <th className="border p-2">Class</th>
          <th className="border p-2">Section</th>
        </tr>
      </thead>

      <tbody>

        {students.map((s)=>(
          <tr key={s.id}>
            <td className="border p-2">{s.name}</td>
            <td className="border p-2">{s.email}</td>
            <td className="border p-2">{s.class_id}</td>
            <td className="border p-2">{s.section_id}</td>
          </tr>
        ))}

      </tbody>

    </Table>
  )
}