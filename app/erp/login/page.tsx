"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

  const [email,setEmail] = useState("")
  const [otp,setOtp] = useState("")
  const [step,setStep] = useState("email")
  const [loading,setLoading] = useState(false)

  async function sendOtp(){

    if(!email){
      alert("Enter email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email
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

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    if(error){
      alert(error.message)
      setLoading(false)
      return
    }

       if (!data?.user) {
      alert("Login failed")
     setLoading(false)
     return
    }
 
     const userId = data.user.id


    // GET USER ROLE + SCHOOL

    const { data:userData } =
      await supabase
        .from("users")
        .select("school_id,role")
        .eq("id",userId)
        .single()

    if(!userData){
      alert("User not linked to school")
      setLoading(false)
      return
    }


    // GET SCHOOL SUBDOMAIN

    const { data:school } =
      await supabase
        .from("schools")
        .select("subdomain")
        .eq("id",userData.school_id)
        .single()

    if(!school){
      alert("School not found")
      setLoading(false)
      return
    }

    const subdomain = school.subdomain


    // ROLE BASED REDIRECT

    if(userData.role === "admin"){

      window.location.href =
      `https://${subdomain}.erp.naysha.online/erp/dashboard`

    }

    if(userData.role === "teacher"){

      window.location.href =
      `https://${subdomain}.erp.naysha.online/erp/teacher/dashboard`

    }

    if(userData.role === "parent"){

      window.location.href =
      `https://${subdomain}.erp.naysha.online/parent/dashboard`

    }

  }


  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[400px]">

        <h1 className="text-2xl font-bold mb-6">
          ERP Login
        </h1>

        {step === "email" && (

          <>
            <input
              placeholder="Email"
              className="w-full p-2 mb-6 rounded bg-slate-800"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <button
              onClick={sendOtp}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>

        )}


        {step === "otp" && (

          <>
            <input
              placeholder="Enter OTP"
              className="w-full p-2 mb-6 rounded bg-slate-800"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
            />

            <button
              onClick={verifyOtp}
              className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </>

        )}

      </div>

    </div>

  )

}