"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ResetPassword(){

  const router = useRouter()

  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  const updatePassword = async () => {

    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)

    if(error){
      alert(error.message)
      return
    }

    alert("Password updated successfully")

    router.push("/login")

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px]">

        <h2 className="text-white text-xl mb-6">
          Set New Password
        </h2>

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
        />

        <button
          onClick={updatePassword}
          className="w-full bg-green-600 p-3 rounded text-white"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

      </div>

    </div>

  )

}