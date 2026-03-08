"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SettingsPage(){

  const [schoolName,setSchoolName] = useState("")
  const [address,setAddress] = useState("")
  const [email,setEmail] = useState("")
  const [phone,setPhone] = useState("")
  const [year,setYear] = useState("")
  const [website,setWebsite] = useState("")
  const [currency,setCurrency] = useState("INR")
  const [logo,setLogo] = useState<File | null>(null)

  async function uploadLogo(){

    if(!logo) return ""

    const fileName = Date.now() + "-" + logo.name

    const { data,error } = await supabase.storage
      .from("school-assets")
      .upload(fileName,logo)

    if(error){
      console.log(error)
      return ""
    }

    const publicUrl =
      supabase.storage
      .from("school-assets")
      .getPublicUrl(fileName).data.publicUrl

    return publicUrl

  }

  async function saveSettings(){

    const logoUrl = await uploadLogo()

    await supabase.from("settings").insert([
      {
        school_name:schoolName,
        school_address:address,
        email:email,
        phone:phone,
        academic_year:year,
        website:website,
        currency:currency,
        logo_url:logoUrl
      }
    ])

    alert("Settings Saved")

  }

  return(

    <div>

      <h1 className="text-3xl font-bold mb-6">
        School Settings
      </h1>

      <div className="bg-white/10 p-8 rounded-xl w-[500px]">

        <input
        placeholder="School Name"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setSchoolName(e.target.value)}
        />

        <input
        placeholder="School Address"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setAddress(e.target.value)}
        />

        <input
        placeholder="Email"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setEmail(e.target.value)}
        />

        <input
        placeholder="Phone"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setPhone(e.target.value)}
        />

        <input
        placeholder="Academic Year"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setYear(e.target.value)}
        />

        <input
        placeholder="Website"
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setWebsite(e.target.value)}
        />

        <select
        className="w-full p-2 mb-3 rounded bg-slate-800"
        onChange={(e)=>setCurrency(e.target.value)}
        >
          <option value="INR">INR</option>
          <option value="USD">USD</option>
        </select>

        <input
        type="file"
        className="w-full mb-4"
        onChange={(e)=>setLogo(e.target.files?.[0] || null)}
        />

        <button
        onClick={saveSettings}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded"
        >
        Save Settings
        </button>

      </div>

    </div>

  )
}