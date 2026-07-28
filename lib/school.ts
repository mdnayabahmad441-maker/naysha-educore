import { supabase } from "./supabase"

let cachedSchoolId: string | null = null
let cachedUserId: string | null = null
let schoolIdRequest: Promise<string | null> | null = null

async function resolveSchoolId() {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (sessionError) {
      console.error("School session fetch error:", sessionError)
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
      const email = user.email?.trim().toLowerCase()

      const { data: teacher, error: teacherError } = await supabase
        .from("teachers")
        .select("school_id")
        .or(`auth_id.eq.${user.id}${email ? `,email.eq.${email}` : ""}`)
        .limit(1)
        .maybeSingle<{ school_id: string | null }>()

      if (teacherError) {
        console.error("School teacher fetch error:", teacherError)
      }

      if (typeof teacher?.school_id === "string" && teacher.school_id) {
        cachedSchoolId = teacher.school_id
        cachedUserId = user.id
        return teacher.school_id
      }

      if (email) {
        const { data: parent, error: parentError } = await supabase
          .from("parents")
          .select("school_id")
          .or(`auth_id.eq.${user.id},email.eq.${email}`)
          .limit(1)
          .maybeSingle<{ school_id: string | null }>()

        if (parentError) {
          console.error("School parent fetch error:", parentError)
        }

        if (typeof parent?.school_id === "string" && parent.school_id) {
          cachedSchoolId = parent.school_id
          cachedUserId = user.id
          return parent.school_id
        }
      }
    }

    return null
  } catch (err) {
    console.error("School error:", err)
    return null
  }
}

export function getSchoolId() {
  if (!schoolIdRequest) {
    schoolIdRequest = resolveSchoolId().finally(() => {
      schoolIdRequest = null
    })
  }

  return schoolIdRequest
}
