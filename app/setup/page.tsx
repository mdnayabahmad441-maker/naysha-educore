"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { hashPin } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function SetupPage(){

  const router = useRouter()

  const [username,setUsername] = useState("")
  const [pin,setPin] = useState("")
  const [loading,setLoading] = useState(false)

  const setup = async ()=>{

    const { data:userData } = await supabase.auth.getUser()

    const user = userData.user

    if(!user){
      alert("Login first")
      return
    }

    setLoading(true)

    const hashed = await hashPin(pin)

    await supabase.from("admin_users").insert([
      {
        id:user.id,
        email:user.email,
        username,
        pin:hashed,
        school_id:null // you can attach later
      }
    ])

    alert("Setup complete")

    router.push("/login")
  }

  return(

    <div className="h-screen flex items-center justify-center bg-[#0b1220] text-white">

      <div className="bg-white/10 p-8 rounded-xl w-96 space-y-4">

        <h1 className="text-xl">Setup Account</h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e)=>setUsername(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded"
        />

        <input
          type="password"
          placeholder="Set PIN"
          value={pin}
          onChange={(e)=>setPin(e.target.value)}
          className="w-full p-3 bg-[#0b1220] rounded"
        />

        <button
          onClick={setup}
          className="w-full bg-green-600 p-3 rounded"
        >
          {loading ? "Saving..." : "Save"}
        </button>

      </div>

    </div>
  )
}