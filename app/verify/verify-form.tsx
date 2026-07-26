"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useSearchParams } from "next/navigation"

export default function VerifyForm(){

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""

  const [otp,setOtp] = useState("")
  const [loading,setLoading] = useState(false)

  const verifyOTP = async () => {

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    router.replace("/admin/dashboard")
  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px] shadow-xl">

        <h2 className="text-white text-2xl mb-6 text-center font-semibold">
          Enter OTP
        </h2>

        <input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e)=>setOtp(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#2a3147] text-white placeholder-gray-400 border border-gray-600 focus:outline-none focus:border-green-500"
        />

        <button
          onClick={verifyOTP}
          className="w-full bg-green-600 hover:bg-green-700 transition p-3 rounded text-white font-medium"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </div>

    </div>
  )
}