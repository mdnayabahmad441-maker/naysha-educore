"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateSchoolPage() {

  const [name,setName] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)

  async function handleCreateSchool(){

    if(!name || !email || !phone || !subdomain || !password){
      alert("Please fill all fields")
      return
    }

    setLoading(true)

    try{

      // 1️⃣ Check if subdomain already exists

      const { data:existing } =
        await supabase
        .from("schools")
        .select("id")
        .eq("subdomain",subdomain)
        .single()

      if(existing){
        alert("Subdomain already taken")
        setLoading(false)
        return
      }

      // 2️⃣ Create auth user

      const { data:authData , error:authError } =
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

      if(!userId){
        alert("User creation failed")
        setLoading(false)
        return
      }

      // 3️⃣ Create school

      const { data:school , error:schoolError } =
        await supabase
        .from("schools")
        .insert({
          name,
          email,
          phone,
          subdomain
        })
        .select()
        .single()

      if(schoolError){
        alert(schoolError.message)
        setLoading(false)
        return
      }

      // 4️⃣ Create admin user

      const { error:userError } =
        await supabase
        .from("users")
        .insert({
          id:userId,
          school_id:school.id,
          email:email,
          role:"admin"
        })

      if(userError){
        alert(userError.message)
        setLoading(false)
        return
      }

      // 5️⃣ Redirect to school ERP

      window.location.href =
        `https://${subdomain}.erp.naysha.online/erp/dashboard`

    }
    catch(err:any){
      alert(err.message)
    }

    setLoading(false)

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">

      <div className="bg-white/10 p-10 rounded-xl w-[420px]">

        <h1 className="text-2xl font-bold mb-6">
          Register School
        </h1>

        <input
          placeholder="School Name"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          placeholder="Phone"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <input
          placeholder="Subdomain"
          className="w-full p-2 mb-4 rounded bg-slate-800"
          value={subdomain}
          onChange={(e)=>setSubdomain(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-6 rounded bg-slate-800"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          onClick={handleCreateSchool}
          className="w-full py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}