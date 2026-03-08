"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function TeachersPage() {

  const [teachers, setTeachers] = useState<any[]>([])
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [phone, setPhone] = useState("")

  async function fetchTeachers() {
    const { data } = await supabase
      .from("teachers")
      .select("*")

    if (data) {
      setTeachers(data)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  async function addTeacher() {

    await supabase.from("teachers").insert([
      {
        name: name,
        subject: subject,
        phone: phone
      }
    ])

    setName("")
    setSubject("")
    setPhone("")

    fetchTeachers()
  }

  return (
    <div className="p-10 text-white">

      <h1 className="text-3xl font-bold mb-6">
        Teacher Management
      </h1>

      {/* ADD TEACHER FORM */}
      <div className="bg-white/10 p-6 rounded-xl mb-10 w-[400px]">

        <h2 className="text-xl mb-4">Add Teacher</h2>

        <input
          placeholder="Teacher Name"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Subject"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={subject}
          onChange={(e)=>setSubject(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 mb-3 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <button
          onClick={addTeacher}
          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Add Teacher
        </button>

      </div>

      {/* TEACHER TABLE */}
      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl mb-4">Teachers List</h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-300">
              <th>Name</th>
              <th>Subject</th>
              <th>Phone</th>
            </tr>
          </thead>

          <tbody>

            {teachers.map((teacher)=>(
              <tr key={teacher.id} className="border-t border-gray-700">

                <td className="py-2">{teacher.name}</td>
                <td>{teacher.subject}</td>
                <td>{teacher.phone}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>
  )
}