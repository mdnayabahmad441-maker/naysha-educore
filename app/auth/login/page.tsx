"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function LoginPage(){

const [email,setEmail] = useState("")
const [otp,setOtp] = useState("")
const [step,setStep] = useState("email")
const [loading,setLoading] = useState(false)

async function sendOtp(){

if(!email){
alert("Enter email")
return
}

setLoading(true)

const { error } = await supabase.auth.signInWithOtp({
email
})

setLoading(false)

if(error){
alert(error.message)
return
}

setStep("otp")

}

async function verifyOtp(){

if(!otp){
alert("Enter OTP")
return
}

setLoading(true)

const { data,error } = await supabase.auth.verifyOtp({
email,
token: otp,
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

const { data:user, error:userError } = await supabase
.from("users")
.select("role,school_id")
.eq("id",userId)
.single()

if(userError || !user){
alert("User record not found")
setLoading(false)
return
}

/* GET SCHOOL */

const { data:school, error:schoolError } = await supabase
.from("schools")
.select("subdomain")
.eq("id",user.school_id)
.single()

if(schoolError || !school){
alert("School not found")
setLoading(false)
return
}

const role = user.role
const subdomain = school.subdomain

/* REDIRECT */

if(role==="admin"){
window.location.href =
`https://${subdomain}.erp.naysha.online/admin/dashboard`
return
}

if(role==="teacher"){
window.location.href =
`https://${subdomain}.erp.naysha.online/teacher/dashboard`
return
}

if(role==="parent"){
window.location.href =
`https://${subdomain}.erp.naysha.online/parent/dashboard`
return
}

alert("Invalid role")

}

return(

<div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

<div className="bg-white/10 p-10 rounded-xl w-[400px]">

<h1 className="text-2xl font-bold mb-6">
ERP Login
</h1>

{step==="email" && (

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

{step==="otp" && (

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