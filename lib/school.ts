import { supabase } from "./supabase"

let cachedSchoolId: string | null = null
let cachedUserId: string | null = null

export async function getSchoolId() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser()
    const user = userData?.user

    if (userError) {
      console.error("School user fetch error:", userError)
    }

    if (cachedSchoolId && cachedUserId && cachedUserId === user?.id) {
      return cachedSchoolId
    }

    if (cachedUserId && cachedUserId !== user?.id) {
      cachedSchoolId = null
      cachedUserId = null
    }

    const metadataSchoolId = user?.user_metadata?.school_id

    if (typeof metadataSchoolId === "string" && metadataSchoolId) {
      cachedSchoolId = metadataSchoolId
      cachedUserId = user?.id || null
      return metadataSchoolId
    }

    if (user?.id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("id", user.id)
        .maybeSingle<{ school_id: string | null }>()

      if (profileError) {
        console.error("School profile fetch error:", profileError)
      }

      if (typeof profile?.school_id === "string" && profile.school_id) {
        cachedSchoolId = profile.school_id
        cachedUserId = user.id
        return profile.school_id
      }

      // Profile had no school_id — try a session refresh in case metadata was recently updated
      try {
        await supabase.auth.refreshSession()
        const { data: refreshed } = await supabase.auth.getUser()
        const refreshedId = refreshed?.user?.user_metadata?.school_id
        if (typeof refreshedId === "string" && refreshedId) {
          cachedSchoolId = refreshedId
          cachedUserId = refreshed?.user?.id || null
          return refreshedId
        }
      } catch {}
    }

    return null
  } catch (err) {
    console.error("School error:", err)
    return null
  }
}
