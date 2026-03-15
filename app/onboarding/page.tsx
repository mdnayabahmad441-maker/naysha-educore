"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import Button from "@/components/ui/Button"
import { createSchool } from "@/services/onboarding.service"

export default function Onboarding(){

  const {user} = useAuth()

  const [name,setName] = useState("")
  const [slug,setSlug] = useState("")

  const submit = async()=>{

    if(!user) return

    await createSchool(user.id,name,slug)

    window.location.href="/admin/dashboard"

  }

  return(

    <div className="p-10 text-white max-w-xl mx-auto">

      <h1 className="text-2xl mb-6">
        Create Your School
      </h1>

      <div className="bg-white/10 border border-white/20 backdrop-blur rounded-xl p-6 space-y-4">

        <input
          className="bg-slate-800 border border-white/20 p-2 rounded w-full"
          placeholder="School Name"
          value={name}
          onChange={(e)=>setName(e.target.value)}
        />

        <input
          className="bg-slate-800 border border-white/20 p-2 rounded w-full"
          placeholder="Subdomain (school name)"
          value={slug}
          onChange={(e)=>setSlug(e.target.value)}
        />

        <Button color="purple" onClick={submit}>
          Create School
        </Button>

      </div>

    </div>

  )

}