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

import { usePathname } from "next/navigation"

const PUBLIC_ROUTES = new Set([
  "/",
  "/features",
  "/for-schools",
  "/pricing",
  "/about",
  "/contact",
  "/book-demo",
  "/security",
  "/privacy",
  "/terms",
  "/data-deletion",
])

export function SchoolProvider({ children }: any) {
  const pathname = usePathname()
  const isPublicRoute = PUBLIC_ROUTES.has(pathname || "")

  const [school, setSchool] = useState<School | null>(null)

  useEffect(() => {
    // Avoid unneeded Supabase session queries on public marketing & policy pages
    if (isPublicRoute) {
      return
    }

    let isMounted = true

    const load = async () => {
      try {
        const schoolId = await getSchoolId()

        if (schoolId && isMounted) {
          const { data: schoolData, error: schoolError } = await supabase
            .from("schools")
            .select("id,name,subdomain,email,phone,address,logo_url")
            .eq("id", schoolId)
            .single()

          if (schoolError) {
            console.error("School fetch error:", schoolError)
          }

          if (schoolData && isMounted) {
            globalSchool = schoolData
            setSchool(schoolData)
            return
          }
        }
      } catch (err) {
        console.error("Context error:", err)
      }
    }

    load()

    return () => {
      isMounted = false
    }
  }, [isPublicRoute])

  // Non-blocking render: Authenticated layouts (admin/teacher/parent) manage their own
  // auth spinners, while public and unauthenticated pages render instantly for SEO & users.
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
