"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Onboarding(){

  const router = useRouter()

  const [form,setForm] = useState({
    schoolName: "",
    subdomain: "",
    email: "",
    phone: ""
  })

  const [loading,setLoading] = useState(false)

  const handleChange = (e:any)=>{
    setForm({...form, [e.target.name]: e.target.value})
  }

  // 🔥 STEP 1: SEND OTP
  const sendOtp = async ()=>{

    if(!form.email){
      alert("Enter email")
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify?onboarding=true`
      }
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    alert("OTP sent to email")
  }

  // 🔥 STEP 2: CREATE SCHOOL AFTER VERIFY
  const createSchool = async ()=>{

    const { schoolName, subdomain, phone } = form

    if(!schoolName || !subdomain){
      alert("Fill all fields")
      return
    }

    setLoading(true)

    // 🔥 GET USER (CRITICAL STEP 2)
    const { data: { user } } = await supabase.auth.getUser()

    if(!user){
      alert("User not authenticated")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("schools")
      .insert([
        {
          id: crypto.randomUUID(),
          name: schoolName,
          subdomain: subdomain,
          phone: phone,
          user_id: user.id   // ✅ CRITICAL (SAAS SECURITY)
        }
      ])

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    alert("School Created ✅")

    router.push("/admin")
  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">

      <div className="bg-[#0b1a33] p-8 rounded-xl w-[420px] space-y-4">

        <h2 className="text-xl font-semibold text-center">
          Create Your School
        </h2>

        {/* SCHOOL NAME */}
        <input
          name="schoolName"
          placeholder="School Name"
          onChange={handleChange}
          className="input"
        />

        {/* SUBDOMAIN */}
        <input
          name="subdomain"
          placeholder="Subdomain (e.g. abc)"
          onChange={handleChange}
          className="input"
        />

        {/* EMAIL */}
        <input
          name="email"
          placeholder="Email"
          onChange={handleChange}
          className="input"
        />

        {/* PHONE */}
        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
          className="input"
        />

        {/* SEND OTP */}
        <button
          onClick={sendOtp}
          className="w-full bg-blue-600 py-3 rounded"
        >
          Send OTP
        </button>

        {/* CREATE SCHOOL */}
        <button
          onClick={createSchool}
          className="w-full bg-green-600 py-3 rounded"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

      <style jsx>{`
        .input {
          width: 100%;
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