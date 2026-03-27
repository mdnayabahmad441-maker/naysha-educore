import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  try {

    if (cachedSchoolId) return cachedSchoolId

    if (typeof window === "undefined") return null

    const host = window.location.hostname
    let subdomain = host.split(".")[0]

    if (host.includes("localhost")) subdomain = "default"

    console.log("SUBDOMAIN:", subdomain)

    // ✅ NEVER USE maybeSingle()
    const { data, error } = await supabase
      .from("schools")
      .select("id")
      .eq("subdomain", subdomain)

    let school = data?.[0] || null

    // 🔥 FALLBACK (CRITICAL)
    if (!school) {
      console.warn("No match → fallback")

      const fallback = await supabase
        .from("schools")
        .select("id")
        .limit(1)

      school = fallback.data?.[0] || null
    }

    if (!school) {
      alert("No school found in DB ❌")
      return null
    }

    cachedSchoolId = school.id
    return school.id

  } catch (err) {
    console.error("School error:", err)
    return null
  }
}