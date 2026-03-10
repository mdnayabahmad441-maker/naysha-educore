"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function CreateSchoolPage(){

  const router = useRouter()

  const [step,setStep] = useState("form")

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [otp,setOtp] = useState("")

  const [loading,setLoading] = useState(false)



  async function sendOtp(){

    if(!name || !email || !phone || !subdomain){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    const { error } =
      await supabase.auth.signInWithOtp({
        email:email
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

    const { data,error } =
      await supabase.auth.verifyOtp({
        email:email,
        token:otp,
        type:"email"
      })

    if(error){
      alert(error.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id

    if(!userId){
      alert("User creation failed")
      setLoading(false)
      return
    }


    // CREATE SCHOOL

    const { data:school,error:schoolError } =
      await supabase
      .from("schools")
      .insert({
        name:name,
        email:email,
        phone:phone,
        subdomain:subdomain
      })
      .select()
      .single()

    if(schoolError){
      alert(schoolError.message)
      setLoading(false)
      return
    }


    // CREATE ADMIN USER

    const { error:userError } =
      await supabase
      .from("users")
      .insert({
        id:userId,
        school_id:school.id,
        email:email,
        role:"admin"
      })

    if(userError){
      alert(userError.message)
      setLoading(false)
      return
    }

    alert("School created successfully")

    router.push("/auth/login")

  }



  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[420px]">

        <h1 className="text-2xl font-bold mb-6">
          Register School
        </h1>



        {step === "form" && (

          <>

            <input
              placeholder="School Name"
              className="w-full p-2 mb-4 rounded bg-slate-800"
              value={name}
              onChange={(e)=>setName(e.target.value)}
            />

            <input
              placeholder="Admin Email"
              className="w-full p-2 mb-4 rounded bg-slate-800"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
            />

            <input
              placeholder="Phone Number"
              className="w-full p-2 mb-4 rounded bg-slate-800"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
            />

            <input
              placeholder="School Subdomain"
              className="w-full p-2 mb-6 rounded bg-slate-800"
              value={subdomain}
              onChange={(e)=>setSubdomain(e.target.value)}
            />

            <button
              onClick={sendOtp}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
            >
              {loading ? "Sending OTP..." : "Create School"}
            </button>

          </>

        )}



        {step === "otp" && (

          <>

            <p className="mb-4 text-gray-400">
              Enter the OTP sent to {email}
            </p>

            <input
              placeholder="Enter OTP"
              className="w-full p-2 mb-6 rounded bg-slate-800"
              value={otp}
              onChange={(e)=>setOtp(e.target.value)}
            />

            <button
              onClick={verifyOtp}
              className="w-full py-2 bg-green-600 rounded"
            >
              {loading ? "Verifying..." : "Verify & Create School"}
            </button>

          </>

        )}



      </div>

    </div>

  )

}