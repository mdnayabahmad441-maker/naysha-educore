"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

const SchoolContext = createContext<any>(null)

export function SchoolProvider({ children }: any){

  const [school, setSchool] = useState<any>(null)

  useEffect(()=>{

    const load = async () => {

      const host = window.location.hostname
      const subdomain = host.split(".")[0]

      if(subdomain === "localhost") return

      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("subdomain", subdomain)
        .single()

      setSchool(data)
    }

    load()

  },[])

  return (
    <SchoolContext.Provider value={school}>
      {children}
    </SchoolContext.Provider>
  )
}

export const useSchool = () => useContext(SchoolContext)