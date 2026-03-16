"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Onboarding() {

  const router = useRouter()

  const [schoolName,setSchoolName] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [loading,setLoading] = useState(false)

  const createSchool = async () => {

    if(!schoolName || !subdomain || !email){
      alert("Please fill all required fields")
      return
    }

    setLoading(true)

    // 1️⃣ Create school
    const { data:school, error:schoolError } = await supabase
      .from("schools")
      .insert({
        name: schoolName,
        subdomain: subdomain,
        email: email,
        phone: phone
      })
      .select()
      .single()

    if(schoolError){
      alert(schoolError.message)
      setLoading(false)
      return
    }

    // 2️⃣ Send OTP
    const { error:otpError } = await supabase.auth.signInWithOtp({
      email
    })

    setLoading(false)

    if(otpError){
      alert(otpError.message)
      return
    }

    // 3️⃣ Go to verify page
    router.push(`/verify?email=${email}&school=${school.id}`)

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[400px] shadow-xl">

        <h2 className="text-white text-2xl mb-6 text-center font-semibold">
          Create Your School ERP
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#2a3147] text-white border border-gray-600"
        />

        <input
          placeholder="Subdomain (example: childrensacademy)"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#2a3147] text-white border border-gray-600"
        />

        <input
          placeholder="Admin Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#2a3147] text-white border border-gray-600"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-[#2a3147] text-white border border-gray-600"
        />

        <button
          onClick={createSchool}
          className="w-full bg-green-600 hover:bg-green-700 p-3 rounded text-white font-semibold"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}