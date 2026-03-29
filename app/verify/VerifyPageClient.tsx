"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyPageClient() {

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

  const wait = (ms: number) => new Promise(res => setTimeout(res, ms))

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

      // ✅ CREATE PROFILE
      await supabase.from("profiles").upsert({
        id: userId,
        school_id: newSchool.id,
        role: "admin"
      })

      // ✅ UPDATE JWT METADATA
      await supabase.auth.updateUser({
        data: {
          school_id: newSchool.id
        }
      })

      // 🔥 CRITICAL FIX: WAIT FOR JWT PROPAGATION
      await wait(800)

      // 🔥 FORCE SESSION RELOAD
      await supabase.auth.getSession()

      localStorage.removeItem("onboardingData")

      // 🚀 DIRECT REDIRECT (NO LOGIN PAGE)
      window.location.href = `https://${newSchool.subdomain}.naysha.online/admin`
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
        .maybeSingle()

      if (!student?.school_id) {
        alert("Parent linked school not found")
        return
      }

      const { data: school } = await supabase
        .from("schools")
        .select("subdomain")
        .eq("id", student.school_id)
        .maybeSingle()

      if (!school?.subdomain) {
        alert("School not found")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: student.school_id,
        role: "parent"
      })

      await supabase.auth.updateUser({
        data: {
          school_id: student.school_id
        }
      })

      await wait(800)
      await supabase.auth.getSession()

      window.location.href = `https://${school.subdomain}.naysha.online/parent`
      return
    }

    // =========================
    // 🔥 TEACHER FLOW
    // =========================
    const { data: teacher } = await supabase
      .from("teachers")
      .select("id, school_id")
      .eq("email", email)
      .maybeSingle()

    if (teacher) {

      const { data: school } = await supabase
        .from("schools")
        .select("subdomain")
        .eq("id", teacher.school_id)
        .maybeSingle()

      if (!school?.subdomain) {
        alert("School not found")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: teacher.school_id,
        role: "teacher"
      })

      await supabase.auth.updateUser({
        data: {
          school_id: teacher.school_id
        }
      })

      await wait(800)
      await supabase.auth.getSession()

      window.location.href = `https://${school.subdomain}.naysha.online/teacher`
      return
    }

    // =========================
    // 🔥 ADMIN LOGIN FLOW
    // =========================
    const { data: school } = await supabase
      .from("schools")
      .select("id, subdomain")
      .eq("email", email)
      .maybeSingle()

    if (!school?.subdomain) {
      setLoading(false)
      alert("School not found")
      return
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: school.id,
      role: "admin"
    })

    await supabase.auth.updateUser({
      data: {
        school_id: school.id
      }
    })

    await wait(800)
    await supabase.auth.getSession()

    window.location.href = `https://${school.subdomain}.naysha.online/admin`
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