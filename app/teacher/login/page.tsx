"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function TeacherLogin() {

  const [email,setEmail] = useState("")
  const [otp,setOtp] = useState("")
  const [step,setStep] = useState("email")
  const [loading,setLoading] = useState(false)

  const router = useRouter()

  async function sendOtp(){

    if(!email){
      alert("Enter teacher email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    alert("OTP sent to your email")

    setStep("otp")

  }

  async function verifyOtp(){

    if(!otp){
      alert("Enter OTP")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.verifyOtp({
      email: email,
      token: otp,
      type: "email"
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    router.push("/teacher/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-black text-white">

      <div className="bg-white/10 p-8 rounded-xl w-[350px]">

        <h1 className="text-2xl font-bold mb-6">
          Teacher Login
        </h1>


        {step === "email" && (

          <div className="space-y-4">

            <input
              type="email"
              placeholder="Enter teacher email"
              className="w-full p-3 rounded bg-slate-800"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full p-3 bg-blue-600 rounded"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

          </div>

        )}


        {step === "otp" && (

          <div className="space-y-4">

            <p className="text-sm text-gray-300">
              Enter OTP sent to {email}
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full p-3 rounded bg-slate-800"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
            />

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full p-3 bg-green-600 rounded"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

          </div>

        )}

      </div>

    </div>

  )

}