"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function VerifyPageClient() {

  const params = useSearchParams()
  const email = (params.get("email") || "").trim().toLowerCase()

  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">
        Email missing. Please login again.
      </div>
    )
  }

  const getCurrentSubdomain = () => {
    if (typeof window === "undefined") return null

    const host = window.location.hostname
    const subdomain = host.split(".")[0]

    if (
      host.includes("localhost") ||
      subdomain === "www" ||
      subdomain === "erp" ||
      subdomain === "naysha"
    ) {
      return null
    }

    return subdomain
  }

  const findSchoolSubdomain = async (schoolId: string) => {
    const { data: school } = await supabase
      .from("schools")
      .select("subdomain")
      .eq("id", schoolId)
      .maybeSingle()

    return school?.subdomain || getCurrentSubdomain()
  }

  const updateUserMetadataIfNeeded = async (userData: any, schoolId: string, role: string) => {
    const currentMetadata = userData.user.user_metadata || {}

    if (currentMetadata.school_id !== schoolId || currentMetadata.role !== role) {
      await supabase.auth.updateUser({
        data: {
          school_id: schoolId,
          role: role
        }
      })
    }
  }

  const redirectWithSession = async (subdomain: string, next: string) => {

    const { data: sessionData } = await supabase.auth.getSession()

    const access_token = sessionData.session?.access_token
    const refresh_token = sessionData.session?.refresh_token

    if (!access_token || !refresh_token) {
      alert("Session missing")
      return
    }

    // 🔥 SEND TOKENS TO CALLBACK
    window.location.href =
      `/auth/callback?` +
      `access_token=${access_token}` +
      `&refresh_token=${refresh_token}` +
      `&subdomain=${subdomain}` +
      `&next=${next}`
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

      // ✅ PROFILE
      await supabase.from("profiles").upsert({
        id: userId,
        school_id: newSchool.id,
        role: "admin"
      })

      // ✅ JWT UPDATE (only if needed to avoid invalidating other sessions)
      await updateUserMetadataIfNeeded(userData, newSchool.id, "admin")

      localStorage.removeItem("onboardingData")

      // 🔥 FIXED REDIRECT (use current session, don't refresh)
      await redirectWithSession(newSchool.subdomain, "/admin")
      return
    }

    // =========================
    // 🔥 PARENT FLOW
    // =========================
    const { data: parents } = await supabase
      .from("parents")
      .select("id, student_id, school_id")
      .ilike("email", `%${email}%`)
      .limit(1)

    const parent = parents?.[0]

    if (parent) {

      let schoolId = parent.school_id

      if (!schoolId) {
        const { data: student } = await supabase
          .from("students")
          .select("school_id")
          .eq("id", parent.student_id)
          .maybeSingle()

        schoolId = student?.school_id
      }

      if (!schoolId) {
        setLoading(false)
        alert("Parent linked school not found")
        return
      }

      const subdomain = await findSchoolSubdomain(schoolId)

      if (!subdomain) {
        setLoading(false)
        alert("School not found")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: schoolId,
        role: "parent"
      })

      await updateUserMetadataIfNeeded(userData, schoolId, "parent")

      // 🔥 FIXED REDIRECT (use current session, don't refresh)
      await redirectWithSession(subdomain, "/parent")
      return
    }

    // =========================
    // 🔥 TEACHER FLOW
    // =========================
      const { data: teacher } = await supabase
        .from("teachers")
        .select("id, school_id")
        .ilike("email", email)
        .maybeSingle()

    if (teacher) {

      const subdomain = await findSchoolSubdomain(teacher.school_id)

      if (!subdomain) {
        setLoading(false)
        alert("School not found")
        return
      }

      await supabase.from("profiles").upsert({
        id: userId,
        school_id: teacher.school_id,
        role: "teacher"
      })

      await supabase
        .from("teachers")
        .update({ auth_id: userId })
        .eq("id", teacher.id)

      await updateUserMetadataIfNeeded(userData, teacher.school_id, "teacher")

      // 🔥 FIXED REDIRECT (use current session, don't refresh)
      await redirectWithSession(subdomain, "/teacher")
      return
    }

    // =========================
    // 🔥 ADMIN LOGIN FLOW
    // =========================
    const { data: school } = await supabase
      .from("schools")
      .select("id, subdomain")
      .ilike("email", email)
      .maybeSingle()

    if (!school?.subdomain) {
      setLoading(false)
      alert("No parent, teacher, or admin account found for this email")
      return
    }

    await supabase.from("profiles").upsert({
      id: userId,
      school_id: school.id,
      role: "admin"
    })

    await updateUserMetadataIfNeeded(userData, school.id, "admin")

    // 🔥 FIXED REDIRECT (use current session, don't refresh)
    await redirectWithSession(school.subdomain, "/admin")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

<div className="bg-linear-to-br from-blue-700 to-indigo-900 p-8 rounded-xl w-95">

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
