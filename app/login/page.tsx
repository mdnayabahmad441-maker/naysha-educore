"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {

  const router = useRouter()

  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")
  const [loading, setLoading] = useState(false)

  const login = async () => {

    if (!username || !pin) {
      alert("Enter username & PIN")
      return
    }

    setLoading(true)

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, pin })
    })

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      alert(data.error)
      return
    }

    // ✅ Save session
    document.cookie = `user=${JSON.stringify(data.user)}; path=/`

    router.push("/admin")
  }

  return (

    <div className="min-h-screen flex bg-[#020c1b] text-white">

      {/* LEFT SIDE (DESIGN SAME AS BEFORE) */}
      <div className="w-1/2 p-16 flex flex-col justify-center">

        <h1 className="text-4xl font-bold mb-6">
          Modern ERP for Schools
        </h1>

        <p className="text-gray-400 mb-10">
          NaySha EduCore is a modern cloud-based school ERP platform designed to simplify school management.
        </p>

        <div className="grid grid-cols-2 gap-4">

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            📊 Student Management
          </div>

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            👨‍🏫 Teacher Management
          </div>

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            📝 Exams & Report Cards
          </div>

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            💰 Fees & Payments
          </div>

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            📈 Analytics Dashboard
          </div>

          <div className="bg-[#0b1a33] p-4 rounded-lg">
            📅 Attendance Tracking
          </div>

        </div>

      </div>

      {/* RIGHT SIDE (LOGIN CARD) */}
      <div className="w-1/2 flex items-center justify-center">

        <div className="bg-[#0b1a33] p-8 rounded-xl w-[400px]">

          <h2 className="text-xl font-semibold mb-6 text-center">
            Login to Your School ERP
          </h2>

          {/* USERNAME */}
          <input
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-[#020c1b] border border-white/10 outline-none"
          />

          {/* PIN */}
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e)=>setPin(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg bg-[#020c1b] border border-white/10 outline-none"
          />

          {/* LOGIN BUTTON */}
          <button
            onClick={login}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* LINKS */}
          <div className="text-center mt-4 text-sm text-gray-400">

            {/* ✅ FIXED CLICKABLE VERIFY */}
            <p>
              First time?{" "}
              <a
                href="/verify"
                className="text-blue-400 hover:underline"
              >
                Verify email to setup
              </a>
            </p>

          </div>

          {/* DIVIDER */}
          <div className="flex items-center my-6 text-gray-500 text-sm">
            <div className="flex-1 h-px bg-white/10"></div>
            <span className="px-3">OR</span>
            <div className="flex-1 h-px bg-white/10"></div>
          </div>

          {/* ✅ CREATE SCHOOL BUTTON */}
          <a href="/onboarding">
            <button className="w-full border border-white/20 py-3 rounded-lg hover:bg-white/10">
              Create New School
            </button>
          </a>

        </div>

      </div>

    </div>

  )
}