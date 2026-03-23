"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function Onboarding() {

  const router = useRouter()

  const [form, setForm] = useState({
    schoolName: "",
    domain: "",
    email: "",
    phone: "",
    username: "",
    pin: ""
  })

  const [loading, setLoading] = useState(false)

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const createSchool = async () => {

    const { schoolName, domain, email, phone, username, pin } = form

    // ✅ FULL VALIDATION
    if (!schoolName || !domain || !email || !phone || !username || !pin) {
      alert("Fill all fields")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || "Something went wrong")
        return
      }

      alert("School created successfully")

      router.push("/login")

    } catch (err) {
      console.error(err)
      alert("Server error")
    } finally {
      setLoading(false)
    }
  }

  return (

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-[#0b1a33] p-8 rounded-xl w-[420px]">

        <h2 className="text-xl font-semibold mb-6 text-center">
          Create Your School ERP
        </h2>

        {/* ✅ FIXED NAME */}
        <input
          name="schoolName"
          value={form.schoolName}
          placeholder="School Name"
          onChange={handleChange}
          className="input"
        />

        <input
          name="domain"
          value={form.domain}
          placeholder="School Domain (subdomain)"
          onChange={handleChange}
          className="input"
        />

        <input
          name="email"
          value={form.email}
          placeholder="Email"
          onChange={handleChange}
          className="input"
        />

        <input
          name="phone"
          value={form.phone}
          placeholder="Phone"
          onChange={handleChange}
          className="input"
        />

        {/* 🔥 ADMIN SECTION */}
        <p className="text-sm text-gray-400 mt-4 mb-2">
          Admin Login Setup
        </p>

        <input
          name="username"
          value={form.username}
          placeholder="Create Username"
          onChange={handleChange}
          className="input"
        />

        <input
          name="pin"
          type="password"
          value={form.pin}
          placeholder="Create PIN"
          onChange={handleChange}
          className="input"
        />

        <button
          onClick={createSchool}
          disabled={loading}
          className="w-full mt-4 bg-green-600 py-3 rounded-lg hover:bg-green-700 transition"
        >
          {loading ? "Creating..." : "Create School"}
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