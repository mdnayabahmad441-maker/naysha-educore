"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function ParentLogin(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState("")

  async function handleLogin(e:any){

    e.preventDefault()

    setLoading(true)
    setError("")

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(error){
      setError(error.message)
      setLoading(false)
      return
    }

    router.push("/parent/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <form
        onSubmit={handleLogin}
        className="bg-white/10 p-8 rounded-xl w-full max-w-md space-y-4"
      >

        <h1 className="text-2xl font-bold">
          Parent Login
        </h1>

        <input
          type="email"
          placeholder="Parent Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 rounded bg-black border border-gray-700"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 rounded bg-black border border-gray-700"
          required
        />

        {error && (
          <p className="text-red-400 text-sm">
            {error}
          </p>
        )}

        <button
          disabled={loading}
          className="w-full bg-blue-600 p-3 rounded font-semibold"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>

    </div>

  )

}