"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback(){

  const router = useRouter()

  useEffect(()=>{

    const getSession = async () => {

      const { data } = await supabase.auth.getSession()

      if(data.session){
        router.push("/admin/dashboard")
      } else {
        router.push("/login")
      }

    }

    getSession()

  },[])

  return(
    <div className="min-h-screen flex items-center justify-center text-white">
      Logging you in...
    </div>
  )

}