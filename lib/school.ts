import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  try {

    // ✅ CACHE (avoid multiple calls)
    if (cachedSchoolId) return cachedSchoolId

    // ✅ GET SESSION FIRST (IMPORTANT)
    const { data: sessionData } = await supabase.auth.getSession()

    if (!sessionData.session) {
      return null // don't break app
    }

    // ✅ GET FROM JWT (NO DB CALL)
    const schoolId =
      sessionData.session.user.user_metadata?.school_id

    if (!schoolId) return null

    cachedSchoolId = schoolId

    return schoolId

  } catch (err) {
    console.error("School error:", err)
    return null
  }
}