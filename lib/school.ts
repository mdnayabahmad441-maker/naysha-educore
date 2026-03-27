import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  if (cachedSchoolId) return cachedSchoolId

  const host = window.location.hostname
  let subdomain = host.split(".")[0]

  if (host.includes("localhost")) subdomain = "default"

  // 🔥 TRY MATCH
  let { data } = await supabase
    .from("schools")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle()

  // 🔥 FALLBACK (NO ERROR EVER)
  if (!data) {
    const fallback = await supabase
      .from("schools")
      .select("id")
      .limit(1)
      .single()

    if (!fallback.data) {
      console.error("No school in DB")
      return null
    }

    data = fallback.data
  }

  cachedSchoolId = data.id
  return data.id
}