"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyPage() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  // 🚨 SAFETY
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">
        Email missing. Please login again.
      </div>
    )
  }

  const verify = async () => {

    if (!otp) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    // 🔐 VERIFY OTP
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

    // =========================
    // 🏫 ONBOARDING FLOW
    // =========================
    const stored = localStorage.getItem("onboardingData")

    if (stored) {

      const data = JSON.parse(stored)

      const { error: dbError } = await supabase
        .from("schools")
        .insert({
          name: data.schoolName,
          subdomain: data.subdomain.toLowerCase().trim(),
          email: data.email,
          phone: data.phone
        })

      if (dbError) {
        setLoading(false)
        alert(dbError.message)
        return
      }

      localStorage.removeItem("onboardingData")

      alert("School created successfully")

      router.push("/login")
      return
    }

    // =========================
    // 🔥 LOGIN FLOW
    // =========================
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("subdomain")
      .eq("email", email)
      .single()

    if (schoolError || !school?.subdomain) {
      setLoading(false)
      alert("School not found. Please create school.")
      return
    }

    // 🚀 REDIRECT TO SUBDOMAIN
    window.location.href = `https://${school.subdomain}.naysha.online/admin`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-[380px]">

        <h2 className="text-xl mb-6 text-center">
          Enter OTP
        </h2>

        <input
          placeholder="OTP Code"
          value={otp}
          onChange={(e)=>setOtp(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-200 text-black"
        />

        <button
          onClick={verify}
          className="w-full bg-green-500 p-3 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </div>

    </div>
  )
}