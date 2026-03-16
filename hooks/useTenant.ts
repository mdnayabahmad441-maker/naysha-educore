"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useTenant() {

  const [school, setSchool] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const loadTenant = async () => {

      const host = window.location.hostname
      const parts = host.split(".")

      // example: patna.naysha.online
      const subdomain = parts[0]

      try {

        // ignore main domain
        if (
          subdomain === "erp" ||
          subdomain === "www" ||
          host.includes("localhost")
        ) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
          .from("schools")
          .select("*")
          .eq("subdomain", subdomain)
          .single()

        if (error) {
          console.error("Tenant load error:", error)
          setLoading(false)
          return
        }

        setSchool(data)
        setLoading(false)

      } catch (err) {

        console.error("Tenant detection failed", err)
        setLoading(false)

      }

    }

    loadTenant()

  }, [])

  return { school, loading }

}