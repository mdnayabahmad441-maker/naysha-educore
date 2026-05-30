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
    <div className="flex min-h-screen items-center justify-center bg-[#020c1b] px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1a33] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-300">
          NaySha EduCore
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Create Your School</h1>

        <div className="mt-6 space-y-3">
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
            disabled={loading}
            className="w-full rounded-xl bg-cyan-600 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Sending OTP..." : "Create School"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          background: #020c1b;
          border: 1px solid rgba(255, 255, 255, 0.1);
          outline: none;
          color: white;
        }
      `}</style>
    </div>
  )
}
