"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SettingsPage(){

const router = useRouter()

const [schoolId,setSchoolId] = useState<string | null>(null)

const [name,setName] = useState("")
const [address,setAddress] = useState("")
const [phone,setPhone] = useState("")
const [logo,setLogo] = useState("")

const [userEmail,setUserEmail] = useState("")
const [role,setRole] = useState("")

const [loading,setLoading] = useState(false)



/* LOAD SCHOOL + USER */

useEffect(()=>{
loadSchool()
},[])

async function loadSchool(){

const { data:userData } = await supabase.auth.getUser()

const userId = userData.user?.id

if(!userId) return


setUserEmail(userData.user?.email || "")


const { data:user } =
await supabase
.from("users")
.select("school_id,role")
.eq("id",userId)
.single()

if(!user) return

setRole(user.role)

setSchoolId(user.school_id)


const { data:school } =
await supabase
.from("schools")
.select("*")
.eq("id",user.school_id)
.single()

if(school){

setName(school.name || "")
setAddress(school.address || "")
setPhone(school.phone || "")
setLogo(school.logo_url || "")

}

}



/* UPLOAD LOGO */

async function uploadLogo(e:any){

const file = e.target.files[0]

if(!file || !schoolId) return

const fileName = Date.now()+"_"+file.name

setLoading(true)

const { error } =
await supabase.storage
.from("school-logos")
.upload(fileName,file)

if(error){

alert(error.message)

setLoading(false)

return

}

const publicUrl =
`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/school-logos/${fileName}`


const { error:updateError } =
await supabase
.from("schools")
.update({
logo_url:publicUrl
})
.eq("id",schoolId)

if(updateError){

alert(updateError.message)

setLoading(false)

return

}

setLogo(publicUrl)

alert("Logo uploaded successfully")

setLoading(false)

}



/* SAVE SCHOOL SETTINGS */

async function saveSettings(){

if(!schoolId) return

setLoading(true)

const { error } =
await supabase
.from("schools")
.update({
name,
address,
phone
})
.eq("id",schoolId)

if(error){

alert(error.message)

setLoading(false)

return

}

alert("Settings updated successfully")

setLoading(false)

}



/* LOGOUT */

async function logout(){

const confirmLogout = confirm("Are you sure you want to logout?")

if(!confirmLogout) return

await supabase.auth.signOut()

router.push("/auth/login")

}



/* UI */

return(

<div className="p-4 md:p-10 text-white">

<h1 className="text-3xl font-bold mb-8">
School Settings
</h1>



<div className="grid md:grid-cols-2 gap-10">


{/* SCHOOL INFO */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-6">
School Information
</h2>

<input
placeholder="School Name"
value={name}
onChange={(e)=>setName(e.target.value)}
className="w-full p-2 mb-4 rounded bg-slate-800"
/>

<input
placeholder="School Address"
value={address}
onChange={(e)=>setAddress(e.target.value)}
className="w-full p-2 mb-4 rounded bg-slate-800"
/>

<input
placeholder="Phone"
value={phone}
onChange={(e)=>setPhone(e.target.value)}
className="w-full p-2 mb-6 rounded bg-slate-800"
/>

<button
onClick={saveSettings}
className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
>
{loading ? "Saving..." : "Save Settings"}
</button>

</div>



{/* LOGO */}

<div className="bg-white/10 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-6">
School Logo
</h2>

{logo && (

<img
src={logo}
className="h-24 mb-6 rounded"
/>

)}

<input
type="file"
onChange={uploadLogo}
className="mb-4"
/>

<p className="text-gray-400 text-sm">
Recommended size: 300x300 PNG
</p>

</div>


</div>



{/* USER ACCOUNT SECTION */}

<div className="mt-10 bg-white/10 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-6">
User Account
</h2>

<div className="space-y-2 text-gray-300">

<p>
<b>Email:</b> {userEmail}
</p>

<p>
<b>Role:</b> {role}
</p>

</div>

</div>



{/* LOGOUT */}

<div className="mt-6 bg-red-500/10 border border-red-500/20 p-6 rounded-xl">

<h2 className="text-xl font-bold mb-4 text-red-400">
Account
</h2>

<button
onClick={logout}
className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded"
>
Logout
</button>

</div>



</div>

)

}