"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  async function handleLogin(){

    setLoading(true)

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password
      })

    if(error){
      alert(error.message)
      setLoading(false)
      return
    }

    const userId = data.user.id

    // get user school

    const { data:userData } =
      await supabase
        .from("users")
        .select("school_id")
        .eq("id",userId)
        .single()

    if(!userData){
      alert("User not linked to school")
      setLoading(false)
      return
    }

    // get school

    const { data:school } =
      await supabase
        .from("schools")
        .select("subdomain")
        .eq("id",userData.school_id)
        .single()

    if(!school){
      alert("School not found")
      setLoading(false)
      return
    }

    // redirect to school ERP

    window.location.href =
      `http://${school.subdomain}.naysha.online/erp/dashboard`

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[400px]">

        <h1 className="text-2xl font-bold mb-6">
          ERP Login
        </h1>

        <input
          placeholder="Email"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-6 rounded bg-slate-800"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>

    </div>

  )

}