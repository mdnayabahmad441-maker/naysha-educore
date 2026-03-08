"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateSchoolPage() {

  const [schoolName,setSchoolName] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  async function createSchool(){

    setLoading(true)

   // create auth user

const { data:authData, error:authError } =
await supabase.auth.signUp({
  email,
  password,
  options:{
    emailRedirectTo:"http://localhost:3000/auth/callback"
  }
})

if(authError){
  alert(authError.message)
  setLoading(false)
  return
}

const userId = authData.user?.id

    // create school

    const { data:schoolData, error:schoolError } =
      await supabase
        .from("schools")
        .insert([
          {
            name: schoolName,
            subdomain: subdomain,
            email: email,
            phone: phone
          }
        ])
        .select()
        .single()

    if(schoolError){
      alert(schoolError.message)
      setLoading(false)
      return
    }

    // link user to school

    await supabase
      .from("users")
      .insert([
        {
          id: userId,
          role: "admin",
          school_id: schoolData.id
        }
      ])

    alert("School Created Successfully")

    window.location.href = "/erp/login"

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[400px]">

        <h1 className="text-2xl font-bold mb-6">
          Register School
        </h1>

        <input
          placeholder="School Name"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
        />

        <input
          placeholder="Admin Email"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          placeholder="Subdomain (example: greenvalley)"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-6 rounded bg-slate-800"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={createSchool}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}