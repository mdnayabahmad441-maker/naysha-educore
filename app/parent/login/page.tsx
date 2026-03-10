"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function ParentLogin(){

const [email,setEmail] = useState("")
const [loading,setLoading] = useState(false)
const router = useRouter()

async function sendOtp(){

setLoading(true)

const { error } = await supabase.auth.signInWithOtp({

email: email,

options: {
emailRedirectTo: `${window.location.origin}/parent/dashboard`
}

})

setLoading(false)

if(error){

alert(error.message)

}else{

alert("OTP sent to your email")

}

}

return(

<div className="min-h-screen flex items-center justify-center bg-black text-white">

<div className="bg-white/10 p-8 rounded-xl w-96">

<h1 className="text-2xl font-bold mb-6">
Parent Login
</h1>

<input
type="email"
placeholder="Enter Parent Email"
className="w-full p-3 rounded bg-slate-800 mb-4"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<button
onClick={sendOtp}
className="w-full p-3 bg-blue-600 rounded"
disabled={loading}
>

{loading ? "Sending OTP..." : "Send OTP"}

</button>

</div>

</div>

)

}