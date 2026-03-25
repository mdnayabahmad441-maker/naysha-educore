"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyPageClient() {

  const router = useRouter()
  const params = useSearchParams()

  const email = params.get("email") || ""

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">
        Email missing. Please login again.
      </div>
    )
  }

  const verify = async () => {

    if (!otp) {
      alert("Enter OTP")
      return
    }

    setLoading(true)

    // 🔐 VERIFY OTP
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email"
    })

    if (error) {
      setLoading(false)
      alert(error.message)
      return
    }

    // 🔥 GET USER
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      setLoading(false)
      alert("User not found")
      return
    }

    const userId = userData.user.id

    // =========================
    // 🔥 ONBOARDING FLOW
    // =========================
    const stored = localStorage.getItem("onboardingData")

    if (stored) {

      const data = JSON.parse(stored)

      const { data: newSchool, error: dbError } = await supabase
        .from("schools")
        .insert({
          name: data.schoolName,
          subdomain: data.subdomain.toLowerCase().trim(),
          email: data.email,
          phone: data.phone
        })
        .select()
        .single()

      if (dbError || !newSchool) {
        setLoading(false)
        alert(dbError?.message || "School creation failed")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: newSchool.id,
        role: "admin"
      })

      localStorage.removeItem("onboardingData")

      alert("School created successfully")

      router.push("/login")
      return
    }

    // =========================
    // 🔥 PARENT FLOW
    // =========================
    const { data: parent } = await supabase
      .from("parents")
      .select("id, student_id")
      .eq("email", email)
      .maybeSingle()

    if (parent) {

      const { data: student } = await supabase
        .from("students")
        .select("school_id")
        .eq("id", parent.student_id)
        .single()

      if (!student?.school_id) {
        alert("Parent linked school not found")
        return
      }

      const { data: school } = await supabase
        .from("schools")
        .select("subdomain")
        .eq("id", student.school_id)
        .single()

      if (!school?.subdomain) {
        alert("School not found")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: student.school_id,
        role: "parent"
      })

      // ✅ CLEAN REDIRECT (NO TOKENS)
      window.location.href = `https://${school.subdomain}.naysha.online/parent`
      return
    }

    // =========================
    // 🔥 ADMIN / TEACHER FLOW
    // =========================
    const { data: school, error: schoolError } = await supabase
      .from("schools")
      .select("id, subdomain")
      .eq("email", email)
      .single()

    if (schoolError || !school?.subdomain) {
      setLoading(false)
      alert("School not found")
      return
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: school.id,
      role: "admin"
    })

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    const role = profile?.role || "admin"

    const redirectPath =
      role === "teacher" ? "/teacher" : "/admin"

    // ✅ CLEAN REDIRECT (NO TOKENS)
    window.location.href = `https://${school.subdomain}.naysha.online${redirectPath}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-[380px]">

        <h2 className="text-xl mb-6 text-center">
          Enter OTP
        </h2>

        <input
          placeholder="OTP Code"
          value={otp}
          onChange={(e)=>setOtp(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-200 text-black"
        />

        <button
          onClick={verify}
          className="w-full bg-green-500 p-3 rounded"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

      </div>

    </div>
  )
}