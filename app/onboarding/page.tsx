"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Onboarding(){

  const router = useRouter()

  const [schoolName,setSchoolName] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const signup = async () => {

    setLoading(true)

    // create auth user
    const { data:userData, error:userError } =
      await supabase.auth.signUp({
        email,
        password
      })

    if(userError){
      alert(userError.message)
      setLoading(false)
      return
    }

    const userId = userData.user?.id

    // create school
    const { data:school, error:schoolError } =
      await supabase
      .from("schools")
      .insert({
        name:schoolName,
        subdomain:subdomain
      })
      .select()
      .single()

    if(schoolError){
      alert(schoolError.message)
      setLoading(false)
      return
    }

    // update user
    await supabase
      .from("users")
      .update({
        phone:phone,
        school_id:school.id
      })
      .eq("id",userId)

    router.push("/admin/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[420px]">

        <h2 className="text-white text-2xl mb-6 text-center">
          Create Your School ERP
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200"
        />

        <input
          placeholder="Subdomain (example: childrensacademy)"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200"
        />

        <input
          placeholder="Admin Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />

        <button
          onClick={signup}
          className="w-full bg-green-600 p-3 rounded text-white"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}