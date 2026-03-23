"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Onboarding() {

  const router = useRouter()

  const [form, setForm] = useState({
    schoolName: "",
    domain: "",
    email: "",
    phone: ""
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const createSchool = async () => {

    const { schoolName, domain, email, phone } = form

    if (!schoolName || !domain || !email || !phone) {
      alert("Fill all fields")
      return
    }

    setLoading(true)

    // 🔥 STEP 1: SEND OTP
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

    // 🔥 STEP 2: SAVE DATA TEMPORARILY
    localStorage.setItem("onboardingData", JSON.stringify(form))

    // 🔥 STEP 3: REDIRECT TO VERIFY
    router.push(`/verify?email=${email}&type=onboarding`)
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-gradient-to-br from-blue-600/40 to-blue-900/40 backdrop-blur p-8 rounded-xl w-[420px]">

        <h2 className="text-xl font-semibold mb-6 text-center">
          Create Your School ERP
        </h2>

        <input
          name="schoolName"
          placeholder="School Name"
          onChange={handleChange}
          className="input"
        />

        <input
          name="domain"
          placeholder="School Domain (subdomain)"
          onChange={handleChange}
          className="input"
        />

        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="input"
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="input"
        />

        <button
          onClick={createSchool}
          className="w-full mt-4 bg-green-500 hover:bg-green-600 py-3 rounded-lg"
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
        }
      `}</style>

    </div>
  )
}