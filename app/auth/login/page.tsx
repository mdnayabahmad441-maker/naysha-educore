"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useSearchParams } from "next/navigation"

export default function LoginPage(){

const searchParams = useSearchParams()

const [email,setEmail] = useState("")
const [otp,setOtp] = useState("")
const [step,setStep] = useState("email")
const [loading,setLoading] = useState(false)

useEffect(()=>{

const emailFromUrl = searchParams.get("email")

if(emailFromUrl){
setEmail(emailFromUrl)
setStep("otp")
}

},[])



async function sendOtp(){

if(!email){
alert("Enter email")
return
}

setLoading(true)

/* FIND USER SCHOOL */

const {data:user,error:userError} = await supabase
.from("users")
.select("school_id")
.eq("email",email)
.single()

if(userError || !user){
alert("User not found")
setLoading(false)
return
}

/* FIND SCHOOL DOMAIN */

const {data:school,error:schoolError} = await supabase
.from("schools")
.select("subdomain")
.eq("id",user.school_id)
.single()

if(schoolError || !school){
alert("School not found")
setLoading(false)
return
}

/* SEND OTP */

const {error:otpError} = await supabase.auth.signInWithOtp({
email
})

if(otpError){
alert(otpError.message)
setLoading(false)
return
}

/* IF ALREADY ON SCHOOL DOMAIN → JUST SHOW OTP */

const currentHost = window.location.hostname
const schoolDomain = `${school.subdomain}.erp.naysha.online`

if(currentHost === schoolDomain){

setStep("otp")
setLoading(false)
return

}

/* OTHERWISE REDIRECT TO SCHOOL DOMAIN */

window.location.href =
`https://${school.subdomain}.erp.naysha.online/auth/login?email=${email}`

}



async function verifyOtp(){

if(!otp){
alert("Enter OTP")
return
}

setLoading(true)

const {data,error} = await supabase.auth.verifyOtp({
email,
token:otp,
type:"email"
})

if(error){
alert(error.message)
setLoading(false)
return
}

const userId = data.user?.id

if(!userId){
alert("Login failed")
setLoading(false)
return
}

/* GET USER ROLE */

const {data:user} = await supabase
.from("users")
.select("role,school_id")
.eq("id",userId)
.single()

if(!user){
alert("User record missing")
return
}

const role = user.role

/* REDIRECT BASED ON ROLE */

if(role === "admin"){
window.location.href = "/admin/dashboard"
}

if(role === "teacher"){
window.location.href = "/teacher/dashboard"
}

if(role === "parent"){
window.location.href = "/parent/dashboard"
}

}



return(

<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

<div className="bg-white/10 p-10 rounded-xl w-[400px]">

<h1 className="text-2xl font-bold mb-6">
ERP Login
</h1>

{step === "email" && (

<>

<input
placeholder="Email"
className="w-full p-2 mb-6 rounded bg-slate-800"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<button
onClick={sendOtp}
className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
{loading ? "Sending OTP..." : "Send OTP"}
</button>

</>

)}



{step === "otp" && (

<>

<input
placeholder="Enter OTP"
className="w-full p-2 mb-6 rounded bg-slate-800"
value={otp}
onChange={(e)=>setOtp(e.target.value)}
/>

<button
onClick={verifyOtp}
className="w-full py-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded"
>
{loading ? "Verifying..." : "Verify OTP"}
</button>

</>

)}

</div>

</div>

)

}