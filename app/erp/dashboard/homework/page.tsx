"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function HomeworkPage(){

  const [homeworks,setHomeworks] = useState<any[]>([])
  const [title,setTitle] = useState("")
  const [subject,setSubject] = useState("")
  const [description,setDescription] = useState("")
  const [dueDate,setDueDate] = useState("")

  async function fetchHomework(){

    const {data} =
      await supabase.from("homework").select("*")

    if(data) setHomeworks(data)

  }

  useEffect(()=>{
    fetchHomework()
  },[])

  async function addHomework(){

    await supabase.from("homework").insert([
      {
        title:title,
        subject:subject,
        description:description,
        due_date:dueDate
      }
    ])

    setTitle("")
    setSubject("")
    setDescription("")
    setDueDate("")

    fetchHomework()

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        Homework & Assignments
      </h1>

      {/* ADD HOMEWORK */}

      <div className="bg-white/10 p-6 rounded-xl mb-10 w-[400px]">

        <input
        placeholder="Homework Title"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        />

        <input
        placeholder="Subject"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={subject}
        onChange={(e)=>setSubject(e.target.value)}
        />

        <textarea
        placeholder="Description"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        value={description}
        onChange={(e)=>setDescription(e.target.value)}
        />

        <input
        type="date"
        className="w-full p-2 mb-4 rounded bg-slate-800"
        value={dueDate}
        onChange={(e)=>setDueDate(e.target.value)}
        />

        <button
        onClick={addHomework}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Assign Homework
        </button>

      </div>

      {/* HOMEWORK LIST */}

      <div className="bg-white/10 p-6 rounded-xl">

        <h2 className="text-xl mb-4">
          Homework List
        </h2>

        <table className="w-full">

          <thead>
            <tr className="text-left text-gray-400">
              <th>Title</th>
              <th>Subject</th>
              <th>Due Date</th>
            </tr>
          </thead>

          <tbody>

            {homeworks.map((h)=>(
              <tr key={h.id} className="border-t border-gray-700">

                <td className="py-2">{h.title}</td>
                <td>{h.subject}</td>
                <td>{h.due_date}</td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

    </div>

  )

}