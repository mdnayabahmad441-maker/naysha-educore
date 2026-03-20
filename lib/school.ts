import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  // prevent multiple DB calls (VERY IMPORTANT)
  if (cachedSchoolId) return cachedSchoolId

  if (typeof window === "undefined") return null

  const host = window.location.hostname
  console.log("HOST:", host)

  let subdomain = host.split(".")[0]

  // localhost handling
  if (host.includes("localhost")) {
    subdomain = "default"
  }

  // main domain handling
  if (subdomain === "erp" || subdomain === "www") {
    subdomain = "default"
  }

  console.log("SUBDOMAIN:", subdomain)

  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("subdomain", subdomain)
    .single()   // 🔥 use single (not maybeSingle)

  if (error) {
    console.error("School lookup error:", error)
    return null
  }

  if (!data) {
    console.error("No school found for subdomain:", subdomain)
    return null
  }

  cachedSchoolId = data.id

  console.log("School found:", data)

  return data.id
}