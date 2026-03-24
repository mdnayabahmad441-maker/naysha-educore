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

  const handleChange = (e:any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const sendOtp = async () => {

    const { schoolName, domain, email, phone } = form

    if (!schoolName || !domain || !email || !phone) {
      alert("All fields required")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify`
      }
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 pass ALL data
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
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-[400px]">

        <h2 className="text-white text-xl mb-6 text-center">
          Create Your School ERP
        </h2>

        <input name="schoolName" placeholder="School Name" onChange={handleChange} className="input" />
        <input name="domain" placeholder="School Domain (subdomain)" onChange={handleChange} className="input" />
        <input name="email" placeholder="Email" onChange={handleChange} className="input" />
        <input name="phone" placeholder="Phone" onChange={handleChange} className="input" />

        <button onClick={sendOtp} className="w-full mt-3 bg-green-500 p-3 rounded text-white">
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
        }
      `}</style>

    </div>
  )
}