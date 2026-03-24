import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  if (cachedSchoolId) return cachedSchoolId

  if (typeof window === "undefined") return null

  const host = window.location.hostname
  console.log("HOST:", host)

  let subdomain = host.split(".")[0]

  // ✅ HANDLE LOCALHOST
  if (host.includes("localhost")) {
    subdomain = "default"
  }

  // ✅ HANDLE ROOT DOMAIN
  if (subdomain === "erp" || subdomain === "www") {
    subdomain = "default"
  }

  console.log("FINAL SUBDOMAIN:", subdomain)

  // 🔥 TRY FIND SCHOOL
  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle()

  // ✅ IF NOT FOUND → FALLBACK TO DEFAULT
  if (!data) {

    console.warn("No school for subdomain, trying default...")

    const fallback = await supabase
      .from("schools")
      .select("id")
      .eq("subdomain", "default")
      .maybeSingle()

    if (!fallback.data) {
      console.error("No default school found ❌")
      return null
    }

    cachedSchoolId = fallback.data.id
    return fallback.data.id
  }

  cachedSchoolId = data.id

  console.log("School found:", data)

  return data.id
}