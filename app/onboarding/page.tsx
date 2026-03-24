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

  const sendOtp = async () => {

    const { schoolName, domain, email, phone } = form

    if (!schoolName || !domain || !email || !phone) {
      alert("All fields are required")
      return
    }

    setLoading(true)

    // ✅ Send OTP (NO redirect override)
    const { error } = await supabase.auth.signInWithOtp({
      email
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // ✅ Pass ALL data to verify page
    const query = new URLSearchParams({
      email,
      type: "onboarding",
      schoolName,
      domain,
      phone
    }).toString()

    router.push(`/verify?${query}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-[420px] shadow-lg">

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
          onClick={sendOtp}
          className="w-full mt-4 bg-green-500 py-3 rounded-lg font-medium"
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
          color: white;
          outline: none;
        }
      `}</style>

    </div>
  )
}