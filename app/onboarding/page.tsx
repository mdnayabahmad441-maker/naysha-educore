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

    if(!schoolName || !subdomain || !email || !phone || !password){
      alert("Please fill all fields")
      return
    }

    setLoading(true)

    // Create auth user
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

    // Create school
   const { data:school, error:schoolError } =
  await supabase
  .from("schools")
  .insert({
    name: schoolName,
    subdomain: subdomain,
    email: email,
    phone: phone
  })
  
      .select()
      .single()

    if(schoolError){
      alert(schoolError.message)
      setLoading(false)
      return
    }

    // Update user with phone + school
    const { error:updateError } =
      await supabase
      .from("users")
      .update({
        phone:phone,
        school_id:school.id
      })
      .eq("id",userId)

    if(updateError){
      alert(updateError.message)
      setLoading(false)
      return
    }

    router.push("/admin/dashboard")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-10 rounded-xl w-[420px] shadow-xl border border-gray-800">

        <h2 className="text-white text-2xl mb-8 text-center font-semibold">
          Create Your School ERP
        </h2>

        <input
          placeholder="School Name"
          value={schoolName}
          onChange={(e)=>setSchoolName(e.target.value)}
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <input
          placeholder="Subdomain (example: childrensacademy)"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <input
          placeholder="Admin Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <input
          placeholder="Phone Number"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
          className="w-full p-3 mb-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-5 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:border-blue-500 outline-none"
        />

        <button
          onClick={signup}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 p-3 rounded-lg text-white font-semibold transition"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}