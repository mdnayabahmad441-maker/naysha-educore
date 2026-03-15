"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useSchool(userId?: string) {

  const [schoolId, setSchoolId] = useState<string | null>(null)

  useEffect(() => {

    if (!userId) return

    const load = async () => {

      const { data } = await supabase
        .from("users")
        .select("school_id")
        .eq("id", userId)
        .single()

      setSchoolId(data?.school_id ?? null)

    }

    load()

  }, [userId])

  return schoolId

}