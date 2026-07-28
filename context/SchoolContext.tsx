"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

type School = {
  id: string
  name: string
  subdomain: string
  email?: string
  phone?: string
  address?: string
  logo_url?: string
}

const SchoolContext = createContext<School | null>(null)

let globalSchool: School | null = null

export function SchoolProvider({ children }: any) {
  const [school, setSchool] = useState<School | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const schoolId = await getSchoolId()

        if (schoolId) {
          const { data: schoolData, error: schoolError } = await supabase
            .from("schools")
            .select("id,name,subdomain,email,phone,address,logo_url")
            .eq("id", schoolId)
            .single()

          if (schoolError) {
            console.error("School fetch error:", schoolError)
          }

          if (schoolData) {
            globalSchool = schoolData
            setSchool(schoolData)
            setLoading(false)
            return
          }
        }

        console.warn("No school found for current session")
      } catch (err) {
        console.error("Context error:", err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

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

export const useSchool = () => useContext(SchoolContext)

export function getGlobalSchool() {
  return globalSchool
}
