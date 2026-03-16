"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function OnboardingPage() {

  const [name,setName] = useState("")
  const [subdomain,setSubdomain] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [loading,setLoading] = useState(false)

  const createSchool = async()=>{

    if(!name || !subdomain){
      alert("School name and domain required")
      return
    }

    setLoading(true)

    try{

      // check if subdomain exists
      const { data:existing } = await supabase
        .from("schools")
        .select("id")
        .eq("subdomain",subdomain)
        .single()

      if(existing){
        alert("Domain already taken")
        setLoading(false)
        return
      }

      // create school
      const { error } = await supabase
        .from("schools")
        .insert({
          name,
          subdomain,
          email,
          phone
        })

      if(error){
        alert(error.message)
        setLoading(false)
        return
      }

      // redirect to school domain
      window.location.href =
        `https://${subdomain}.naysha.online/admin/dashboard`

    }
    catch(err){
      console.error(err)
      alert("Something went wrong")
    }

    setLoading(false)

  }

  return(

    <div className="min-h-screen flex items-center justify-center bg-slate-950">

      <div className="bg-slate-900 p-8 rounded-xl w-[400px]">

        <h1 className="text-white text-2xl mb-6">
          Create Your School ERP
        </h1>

        <input
          className="w-full mb-4 p-3 rounded bg-slate-800 text-white"
          placeholder="School Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="w-full mb-4 p-3 rounded bg-slate-800 text-white"
          placeholder="School Domain"
          value={subdomain}
          onChange={(e)=>
            setSubdomain(
              e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9]/g,"")
            )
          }
        />

        <input
          className="w-full mb-4 p-3 rounded bg-slate-800 text-white"
          placeholder="Email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <input
          className="w-full mb-6 p-3 rounded bg-slate-800 text-white"
          placeholder="Phone"
          value={phone}
          onChange={(e)=>setPhone(e.target.value)}
        />

        <button
          onClick={createSchool}
          className="w-full bg-green-600 text-white p-3 rounded"
        >
          {loading ? "Creating..." : "Create School"}
        </button>

      </div>

    </div>

  )

}