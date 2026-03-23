"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function CallbackPage() {

  const router = useRouter()

  useEffect(() => {

    const handleLogin = async () => {

      // 🔹 get session
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const email = user.email!

      // 🔹 check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (existingUser) {
        router.push("/admin")
        return
      }

      // 🔥 CREATE NEW SCHOOL + USER

      const subdomain = email.split("@")[0] // simple logic

      // 1. create school
      const { data: school, error: schoolError } = await supabase
        .from("schools")
        .insert({
          name: subdomain + " School",
          subdomain
        })
        .select()
        .single()

      if (schoolError) {
        alert(schoolError.message)
        return
      }

      // 2. create user mapping
      await supabase
        .from("users")
        .insert({
          id: user.id,
          email: email,
          school_id: school.id,
          role: "admin"
        })

      router.push("/admin")

    }

    handleLogin()

  }, [])

  return (
    <div className="text-white flex items-center justify-center min-h-screen bg-[#020c1b]">
      Setting up your workspace...
    </div>
  )
}