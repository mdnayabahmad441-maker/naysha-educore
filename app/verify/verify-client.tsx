"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyClient() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""
  const type = params.get("type") || "login"

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const verify = async () => {

    if (!otp) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 IMPORTANT LOGIC
    if (type === "onboarding") {
      router.push("/login")
    } else {
      router.push("/admin")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-[380px]">

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
          className="w-full bg-green-500 p-3 rounded text-white"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </div>
    </div>
  )
}