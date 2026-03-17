"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {

  const router = useRouter()

  const [email, setEmail] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)

  const sendOTP = async (): Promise<void> => {

    if (!email) {
      alert("Enter your email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    router.push(`/verify?email=${email}`)
  }

  return (
    <div className="min-h-screen bg-[#020c1b] text-white">

      {/* HEADER */}
      <div className="max-w-7xl mx-auto p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">NaySha EduCore</h1>
        <span className="text-sm text-gray-400">
          Smart School ERP Platform
        </span>
      </div>

      {/* HERO + LOGIN */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-12 items-center">

        {/* HERO LEFT */}
        <div>

          <h2 className="text-4xl font-bold mb-6">
            Modern ERP for Schools
          </h2>

          <p className="text-gray-400 mb-8 leading-relaxed">
            NaySha EduCore is a modern cloud-based school ERP platform designed
            to simplify school management. Manage students, teachers, classes,
            attendance, examinations, fees, and reports — all in one system.
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div className="bg-white/10 p-4 rounded-lg">
              📚 Student Management
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              🧑‍🏫 Teacher Management
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              📝 Exams & Report Cards
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              💰 Fees & Payments
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              📊 Analytics Dashboard
            </div>

            <div className="bg-white/10 p-4 rounded-lg">
              📅 Attendance Tracking
            </div>

          </div>

        </div>

        {/* LOGIN CARD */}
        <div className="bg-[#1c2235] p-8 rounded-xl w-full max-w-md mx-auto">

          <h3 className="text-xl font-semibold mb-6 text-center">
            Login to Your School ERP
          </h3>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="w-full p-3 mb-4 rounded bg-gray-200 text-black"
          />

          <button
            onClick={sendOTP}
            className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded"
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>

          <p className="text-gray-400 text-sm mt-4 text-center">
            Secure OTP login for school administrators
          </p>

          <div className="flex items-center my-5">
            <div className="flex-1 h-px bg-gray-600"></div>
            <span className="px-3 text-gray-400 text-xs">OR</span>
            <div className="flex-1 h-px bg-gray-600"></div>
          </div>

          <button
            onClick={() => router.push("/onboarding")}
            className="w-full border border-blue-500 hover:bg-blue-600 p-3 rounded transition"
          >
            Create New School
          </button>

        </div>

      </div>

      {/* WHY SCHOOLS CHOOSE */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        <h3 className="text-2xl font-semibold mb-8 text-center">
          Why Schools Choose NaySha EduCore
        </h3>

        <div className="grid md:grid-cols-3 gap-6 text-gray-300">

          <div className="bg-white/10 p-6 rounded-lg">
            <h4 className="font-semibold mb-2">
              Complete School Management
            </h4>
            <p className="text-sm">
              Manage students, teachers, classes, exams and fees from one dashboard.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <h4 className="font-semibold mb-2">
              Cloud Based ERP
            </h4>
            <p className="text-sm">
              Access your school data securely from anywhere with cloud technology.
            </p>
          </div>

          <div className="bg-white/10 p-6 rounded-lg">
            <h4 className="font-semibold mb-2">
              Scalable SaaS Platform
            </h4>
            <p className="text-sm">
              Designed to support multiple schools with secure data isolation.
            </p>
          </div>

        </div>

      </div>

      {/* FOOTER */}
      <div className="text-center text-gray-500 text-sm pb-6">
        © {new Date().getFullYear()} NaySha EduCore • School ERP SaaS Platform
      </div>

    </div>
  )
}