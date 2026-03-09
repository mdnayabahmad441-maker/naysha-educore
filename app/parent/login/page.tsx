"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ParentLogin(){

  const router = useRouter()

  const [phone,setPhone] = useState("")
  const [otp,setOtp] = useState("")
  const [step,setStep] = useState(1)

  async function sendOTP(){

    const { error } = await supabase.auth.signInWithOtp({
      phone: phone
    })

    if(error){
      alert(error.message)
      return
    }

    setStep(2)

  }

  async function verifyOTP(){

    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: "sms"
    })

    if(error){
      alert(error.message)
      return
    }

    router.push("/parent/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-8 rounded-xl w-[350px]">

        <h1 className="text-2xl font-bold mb-6">
          Parent Login
        </h1>

        {step === 1 && (

          <>
            <input
              placeholder="Phone Number"
              className="w-full p-2 mb-4 rounded bg-slate-800"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
            />

            <button
              onClick={sendOTP}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
            >
              Send OTP
            </button>
          </>

        )}

        {step === 2 && (

          <>
            <input
              placeholder="Enter OTP"
              className="w-full p-2 mb-4 rounded bg-slate-800"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
            />

            <button
              onClick={verifyOTP}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
            >
              Verify OTP
            </button>
          </>

        )}

      </div>

    </div>

  )

}