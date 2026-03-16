"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage(){

  const router = useRouter()

  const [email,setEmail] = useState("")
  const [loading,setLoading] = useState(false)

  const sendOTP = async () => {

    if(!email){
      alert("Enter email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options:{
        shouldCreateUser:false
      }
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    router.push(`/verify?email=${email}`)
  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px] shadow-xl">

        <h2 className="text-white text-2xl mb-6 text-center font-semibold">
          Login to NaySha EduCore
        </h2>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#2a3147] text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-blue-500"
        />

        <button
          onClick={sendOTP}
          className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded text-white font-medium"
        >
          {loading ? "Sending OTP..." : "Continue"}
        </button>

        <p className="text-gray-400 text-sm mt-4 text-center">
          New school?
          <a href="/onboarding" className="text-blue-400 ml-1 hover:underline">
            Create account
          </a>
        </p>

      </div>

    </div>
  )
}