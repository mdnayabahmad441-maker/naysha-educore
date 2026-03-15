"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")

  const login = async () => {

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(error){
      alert(error.message)
      return
    }

    router.push("/admin/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[350px]">

        <h2 className="text-white text-xl mb-6">Login</h2>

        <input
          type="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="Email"
          className="w-full p-3 mb-3 rounded bg-gray-200"
        />

        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="Password"
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 p-3 rounded text-white"
        >
          Login
        </button>

      </div>

    </div>

  )

}