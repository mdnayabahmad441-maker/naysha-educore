"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AdminLayout({ children }: any) {

  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const checkAuth = async () => {

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace("/login")
      } else {
        setLoading(false)
      }

    }

    checkAuth()

  }, [])

  if (loading) {
    return (
      <div style={{padding:40}}>
        Checking authentication...
      </div>
    )
  }

  return children
}