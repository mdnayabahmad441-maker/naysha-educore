"use client"

import { useEffect,useState } from "react"
import Card from "@/components/ui/Card"
import StudentForm from "@/components/students/StudentForm"
import { getStudents } from "@/services/students.service"

export default function StudentsPage(){

  const [students,setStudents] = useState<any[]>([])

  const load = async()=>{
    const data = await getStudents()
    setStudents(data)
  }

  useEffect(()=>{
    load()
  },[])

  return(

    <div className="p-10 text-white max-w-7xl mx-auto">

      <h1 className="text-2xl mb-6">Students</h1>

      <Card>

        <StudentForm onSaved={load}/>

        <div className="overflow-x-auto">

          <table className="w-full text-sm border border-white/20">

            <thead>
              <tr>
                <th className="border p-2">Name</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Class</th>
                <th className="border p-2">Section</th>
              </tr>
            </thead>

            <tbody>

              {students.map((s:any)=>(
                <tr key={s.id}>
                  <td className="border p-2">{s.name}</td>
                  <td className="border p-2">{s.email}</td>
                  <td className="border p-2">{s.classes?.name}</td>
                  <td className="border p-2">{s.sections?.name}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </Card>

    </div>

  )

}