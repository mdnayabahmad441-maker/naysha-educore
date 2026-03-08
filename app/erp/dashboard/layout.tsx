"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function DashboardLayout({children}:{children:React.ReactNode}){

  const router = useRouter()

  const [loading,setLoading] = useState(true)

  useEffect(()=>{

    checkUser()

  },[])

  async function checkUser(){

    const { data } = await supabase.auth.getSession()

    if(!data.session){

      router.push("/erp/login")

      return
    }

    setLoading(false)

  }

  if(loading){

    return(
      <div className="p-10 text-white">
        Checking login...
      </div>
    )

  }

  return <>{children}</>

}