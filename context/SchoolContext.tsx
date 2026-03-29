"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

type School = {
  id: string
  name: string
  subdomain: string
}

const SchoolContext = createContext<School | null>(null)

let globalSchool: School | null = null // 🔥 global cache

export function SchoolProvider({ children }: any){

  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{

    const load = async () => {

      try {

        // ✅ STEP 1: GET SESSION FIRST (IMPORTANT)
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData.session?.user) {

          const schoolId =
            sessionData.session.user.user_metadata?.school_id

          if (schoolId) {

            const schoolData = {
              id: schoolId,
              name: "",
              subdomain: ""
            }

            globalSchool = schoolData
            setSchool(schoolData)
            setLoading(false)
            return
          }
        }

        // ✅ STEP 2: FALLBACK (PUBLIC ACCESS)
        const host = window.location.hostname
        let subdomain = host.split(".")[0]

        if (host.includes("localhost")) {
          subdomain = "default"
        }

        const { data, error } = await supabase
          .from("schools")
          .select("id,name,subdomain")
          .eq("subdomain", subdomain)
          .limit(1) // ✅ NO SINGLE

        if (error) {
          console.error("School fetch error:", error)
          setLoading(false)
          return
        }

        const schoolData = data?.[0] || null

        if (!schoolData) {
          console.warn("No school found")
          setLoading(false)
          return
        }

        globalSchool = schoolData
        setSchool(schoolData)

      } catch (err) {
        console.error("Context error:", err)
      } finally {
        setLoading(false)
      }

    }

    load()

  },[])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020c1b] text-white">
        Loading...
      </div>
    )
  }

  return (
    <SchoolContext.Provider value={school}>
      {children}
    </SchoolContext.Provider>
  )
}

// ✅ Hook
export const useSchool = () => useContext(SchoolContext)

// ✅ Global access (VERY IMPORTANT)
export function getGlobalSchool() {
  return globalSchool
}