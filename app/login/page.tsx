"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const login = async () => {

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    router.push("/admin/dashboard")

  }

  const loginWithGoogle = async () => {

  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

}

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px] shadow-lg">

        <h2 className="text-white text-2xl mb-6 text-center">
          Login to NaySha EduCore
        </h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200 text-black"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />

        <button
          onClick={login}
          className="w-full bg-blue-600 p-3 rounded text-white mb-3"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center text-gray-400 mb-3">
          OR
        </div>

        <button
          onClick={loginWithGoogle}
          className="w-full bg-white text-black p-3 rounded"
        >
          Continue with Google
        </button>

        <p className="text-gray-400 text-sm mt-6 text-center">
          New school?{" "}
          <a href="/onboarding" className="text-blue-400">
            Create account
          </a>
        </p>

      </div>

    </div>

  )

}