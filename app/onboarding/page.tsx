"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function OnboardingPage() {
  const router = useRouter()

  const [schoolName, setSchoolName] = useState("")
  const [subdomain, setSubdomain] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)

  const createSchool = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!schoolName || !subdomain || !normalizedEmail) {
      alert("Fill all fields")
      return
    }

    setLoading(true)

    localStorage.setItem(
      "onboardingData",
      JSON.stringify({
        schoolName,
        subdomain,
        email: normalizedEmail,
        phone,
      })
    )

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (error) {
      alert(error.message || "Failed to send OTP")
      return
    }

    router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}&mode=setup`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020c1b] text-white">
      <div className="w-[420px] rounded-xl bg-[#0b1a33] p-8">
        <h2 className="mb-6 text-center text-xl font-semibold">
          Create Your School
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(event) => setSchoolName(event.target.value)}
          className="input"
        />

        <input
          placeholder="Subdomain (example: abc)"
          value={subdomain}
          onChange={(event) => setSubdomain(event.target.value)}
          className="input"
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="input"
        />

        <button
          type="button"
          onClick={createSchool}
          className="mt-4 w-full rounded-lg bg-green-600 py-3"
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
          border: 1px solid rgba(255, 255, 255, 0.1);
          outline: none;
          color: white;
        }
      `}</style>
    </div>
  )
}
