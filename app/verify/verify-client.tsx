"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyClient() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""
  const type = params.get("type") || ""

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const verify = async () => {

    if (!otp) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    // 🔥 VERIFY OTP
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    // 🔥 IF ONBOARDING → CREATE SCHOOL
    if (type === "onboarding") {

      const stored = localStorage.getItem("onboardingData")

      if (!stored) {
        alert("Session expired. Please try again.")
        router.push("/onboarding")
        return
      }

      const data = JSON.parse(stored)

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await res.json()

      if (!res.ok) {
        setLoading(false)
        alert(result.error)
        return
      }

      // 🧹 CLEANUP
      localStorage.removeItem("onboardingData")

      alert("School created successfully")

      router.push("/login")
      return
    }

    // 🔥 NORMAL LOGIN FLOW
    setLoading(false)
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
          className="w-full p-3 mb-4 rounded bg-gray-200 text-black text-center tracking-widest"
        />

        <button
          onClick={verify}
          className="w-full bg-green-600 p-3 rounded text-white"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </div>

    </div>
  )
}