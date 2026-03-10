"use client"

import { useState } from "react"

export default function CreateSchoolPage() {

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")

  return (

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[400px]">

        <h1 className="text-2xl font-bold mb-6">
          Register School
        </h1>

        <input
          placeholder="School Name"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Admin Email"
          className="w-full p-2 mb-6 rounded bg-slate-800"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          Create School
        </button>

      </div>

    </div>

  )

}