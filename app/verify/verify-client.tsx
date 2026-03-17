"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyClient() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""

  const [otp, setOtp] = useState("")

  const verify = async () => {

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    if (error) {
      alert(error.message)
      return
    }

    router.push("/admin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px]">

        <h2 className="text-white text-xl mb-6 text-center">
          Enter OTP
        </h2>

        <input
          placeholder="OTP Code"
          value={otp}
          onChange={(e)=>setOtp(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-200"
        />

        <button
          onClick={verify}
          className="w-full bg-green-600 p-3 rounded text-white"
        >
          Verify
        </button>

      </div>

    </div>
  )
}