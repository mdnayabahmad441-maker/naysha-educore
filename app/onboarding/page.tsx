"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function OnboardingPage() {

  const router = useRouter()

  const [schoolName, setSchoolName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const createSchool = async () => {

    if (!schoolName || !subdomain || !email) {
      alert("Fill all fields")
      return
    }

    setLoading(true)

    // 🔥 STORE TEMP DATA
    localStorage.setItem("onboardingData", JSON.stringify({
      schoolName,
      subdomain,
      email,
      phone
    }))

    // 🔐 SEND OTP
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 GO TO VERIFY
    router.push(`/verify?email=${email}`)
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-[#0b1a33] p-8 rounded-xl w-[420px]">

        <h2 className="text-xl font-semibold mb-6 text-center">
          Create Your School
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
          className="input"
        />

        <input
          placeholder="Subdomain (example: abc)"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
          className="input"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="input"
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="input"
        />

        <button
          onClick={createSchool}
          className="w-full mt-4 bg-green-600 py-3 rounded-lg"
        >
          {loading ? "Sending OTP..." : "Create School"}
        </button>

      </div>

      <style jsx>{`
        .input {
          width: 100%;
          margin-bottom: 12px;
          padding: 12px;
          border-radius: 8px;
          background: #020c1b;
          border: 1px solid rgba(255,255,255,0.1);
          outline: none;
          color: white;
        }
      `}</style>

    </div>
  )
}