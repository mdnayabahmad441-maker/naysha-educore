"use client"

import { useEffect,useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter,usePathname } from "next/navigation"

export default function DashboardLayout({children}:{children:React.ReactNode}){

  const router = useRouter()
  const pathname = usePathname()

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

    const userId = data.session.user.id

    const { data:user } =
      await supabase
        .from("users")
        .select("role")
        .eq("id",userId)
        .single()

    if(!user){
      router.push("/erp/login")
      return
    }

    const role = user.role


    // =========================
    // TEACHER ACCESS CONTROL
    // =========================

    if(role === "teacher"){

      // If teacher tries to access admin pages
      if(
        pathname.includes("/teachers") ||
        pathname.includes("/fees") ||
        pathname.includes("/settings")
      ){
        router.push("/erp/teacher/dashboard")
        return
      }

      // If teacher opens admin dashboard
      if(pathname === "/erp/dashboard"){
        router.push("/erp/teacher/dashboard")
        return
      }

    }


    // =========================
    // PARENT ACCESS CONTROL
    // =========================

    if(role === "parent"){

      if(
        pathname.includes("/teachers") ||
        pathname.includes("/fees") ||
        pathname.includes("/settings") ||
        pathname.includes("/students") ||
        pathname.includes("/attendance") ||
        pathname.includes("/reports")
      ){
        router.push("/parent/dashboard")
        return
      }

    }

    setLoading(false)

  }

  if(loading){
    return(
      <div className="p-10 text-white">
        Checking access...
      </div>
    )
  }

  return <>{children}</>

}