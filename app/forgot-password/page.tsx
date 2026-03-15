"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function ForgotPassword(){

  const [email,setEmail] = useState("")

  const reset = async () => {

    const { error } = await supabase.auth.resetPasswordForEmail(email,{
      redirectTo:`${window.location.origin}/reset-password`
    })

    if(error){
      alert(error.message)
    }else{
      alert("Password reset link sent to email")
    }

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-[#020c1b]">

      <div className="bg-[#1c2235] p-8 rounded-xl w-[380px]">

        <h2 className="text-white text-xl mb-6">
          Reset Password
        </h2>

        <input
          placeholder="Enter your email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-gray-200"
        />

        <button
          onClick={reset}
          className="w-full bg-blue-600 p-3 rounded text-white"
        >
          Send Reset Link
        </button>

      </div>

    </div>

  )

}