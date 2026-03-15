"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useAuth() {

  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {

    const getUser = async () => {

      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Load ERP user data
      const { data: dbUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", data.user.id)
        .single()

      setUser({
        ...data.user,
        ...dbUser
      })

      setLoading(false)

    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_, session) => {

        if (!session?.user) {
          setUser(null)
          return
        }

        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        setUser({
          ...session.user,
          ...dbUser
        })

      }
    )

    return () => {
      listener.subscription.unsubscribe()
    }

  }, [])

  return { user, loading }

}