"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useTenant() {

  const [school, setSchool] = useState<any>(null)

  useEffect(() => {

    const load = async () => {

      const host = window.location.host
      const slug = host.split(".")[0]

      if (slug === "erp" || slug === "localhost") return

      const { data } = await supabase
        .from("schools")
        .select("*")
        .eq("slug", slug)
        .single()

      setSchool(data)

    }

    load()

  }, [])

  return school

}