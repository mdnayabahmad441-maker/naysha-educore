"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function LoginPage() {

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // ✅ FIXED FUNCTION
  const sendOTP = async () => {
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedEmail) {
      alert("Enter your email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true
      }
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    // 🔥 REDIRECT TO VERIFY PAGE
    router.push(`/verify?email=${encodeURIComponent(normalizedEmail)}`)
  }

  return (

    <div className="min-h-screen bg-[#020c1b] text-white">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <h1 className="text-xl md:text-2xl font-bold">
          NaySha EduCore
        </h1>
        <span className="text-xs md:text-sm text-gray-400">
          Smart School ERP SaaS
        </span>
      </div>

      {/* HERO */}
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-10 items-center">

        {/* LEFT CONTENT */}
        <div>

          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">
            Modern ERP for <br /> Smart Schools
          </h2>

          <p className="text-gray-400 mb-8 leading-relaxed">
            NaySha EduCore is a powerful cloud-based School ERP designed to manage
            students, teachers, attendance, exams, fees, and reports — all in one place.
            Built for scalability, simplicity, and real-time insights.
          </p>

          {/* FEATURES */}
          <div className="grid grid-cols-2 gap-4 text-sm">

            {[
              "📚 Student Management",
              "🧑‍🏫 Teacher Management",
              "📊 Analytics Dashboard",
              "📝 Exams & Results",
              "💰 Fees & Payments",
              "📅 Attendance Tracking"
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/10 border border-white/10 backdrop-blur rounded-xl p-4"
              >
                {item}
              </div>
            ))}

          </div>

        </div>

        {/* LOGIN CARD */}
        <div className="w-full max-w-md mx-auto">

          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6 md:p-8">

            <h3 className="text-xl font-semibold mb-6 text-center">
              Login with Email OTP
            </h3>

            <input
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 mb-4 rounded bg-slate-800 border border-white/20 outline-none"
            />

            <button
              onClick={sendOTP}
              className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>

            {/* CREATE SCHOOL */}
            <p className="text-gray-400 text-sm mt-4 text-center">
              New school?
              <a href="/onboarding" className="text-blue-400 ml-1 hover:underline">
                Create School
              </a>
            </p>

          </div>

        </div>

      </div>

      {/* FOOTER */}
      <div className="text-center text-gray-500 text-xs md:text-sm pb-6">
        © {new Date().getFullYear()} NaySha EduCore • Built for modern schools
      </div>

    </div>
  )
}
