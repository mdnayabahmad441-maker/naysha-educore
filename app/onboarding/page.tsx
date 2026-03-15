"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function Onboarding(){

  const router = useRouter()

  const [schoolName,setSchoolName] = useState("")
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const signup = async () => {

  setLoading(true)

  // 1 create auth user
  const { data:authData, error:authError } =
    await supabase.auth.signUp({
      email,
      password
    })

  if(authError){
    alert(authError.message)
    setLoading(false)
    return
  }

  const userId = authData.user?.id

  // 2 create school
  const { data:school, error:schoolError } =
    await supabase
      .from("schools")
      .insert({
        name:schoolName
      })
      .select()
      .single()

  if(schoolError){
    alert(schoolError.message)
    setLoading(false)
    return
  }

  // 3 wait a moment for auth session
  await new Promise((resolve)=>setTimeout(resolve,1000))

  // 4 create admin user record
  const { error:userError } =
    await supabase
      .from("users")
      .insert({
        id:userId,
        email:email,
        role:"admin",
        school_id:school.id
      })

  if(userError){
    alert(userError.message)
    setLoading(false)
    return
  }

  setLoading(false)

  router.push("/admin/dashboard")

}
  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[420px] shadow-lg">

        <h2 className="text-white text-2xl mb-6 text-center">
          Create Your School ERP
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200 text-black"
        />

        <input
          placeholder="Admin Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-200 text-black"
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