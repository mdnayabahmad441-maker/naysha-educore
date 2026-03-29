import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  try {

    if (cachedSchoolId) return cachedSchoolId

    const { data: userData } = await supabase.auth.getUser()

    const schoolId =
      userData?.user?.user_metadata?.school_id

    // ✅ PRIMARY SOURCE (JWT)
    if (schoolId) {
      cachedSchoolId = schoolId
      return schoolId
    }

    // 🔥 FALLBACK (SUBDOMAIN ONLY — NO INSERT)
    if (typeof window === "undefined") return null

    const host = window.location.hostname
    let subdomain = host.split(".")[0]

    if (
      host.includes("localhost") ||
      subdomain === "www" ||
      subdomain === "erp"
    ) {
      subdomain = "default"
    }

    const { data } = await supabase
      .from("schools")
      .select("id")
      .eq("subdomain", subdomain)
      .limit(1)

    const school = data?.[0]

    if (!school) {
      console.error("No school found")
      return null
    }

    cachedSchoolId = school.id
    return school.id

  } catch (err) {
    console.error("School error:", err)
    return null
  }
}