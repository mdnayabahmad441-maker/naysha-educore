"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyPage() {

  const params = useSearchParams()
  const router = useRouter()

  const email = params.get("email")
  const type = params.get("type")

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  const verifyOTP = async () => {

    if (!otp) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email: email!,
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

      localStorage.removeItem("onboardingData")
    }

    setLoading(false)

    alert("Verified successfully")

    router.push("/login")
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-gradient-to-br from-blue-600/40 to-blue-900/40 backdrop-blur p-8 rounded-xl w-[400px]">

        <h2 className="text-xl font-semibold mb-4 text-center">
          Verify OTP
        </h2>

        <p className="text-sm text-gray-300 text-center mb-6">
          Enter the OTP sent to <br />
          <span className="text-blue-400">{email}</span>
        </p>

        <input
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="input text-center tracking-widest text-lg"
        />

        <button
          onClick={verifyOTP}
          className="w-full mt-4 bg-green-500 hover:bg-green-600 py-3 rounded-lg"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

      </div>

      <style jsx>{`
        .input {
          width: 100%;
          margin-bottom: 12px;
          padding: 14px;
          border-radius: 10px;
          background: #020c1b;
          border: 1px solid rgba(255,255,255,0.1);
          outline: none;
        }
      `}</style>

    </div>
  )
}