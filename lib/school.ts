import { supabase } from "./supabase"

export async function getSchoolId() {

  if (typeof window === "undefined") return null

  const host = window.location.hostname

  console.log("HOST:", host)

  let subdomain = host.split(".")[0]

  // handle localhost
  if (host.includes("localhost")) {
    subdomain = "default"
  }

  // handle erp domain
  if (subdomain === "erp") {
    subdomain = "default"
  }

  console.log("SUBDOMAIN:", subdomain)

  const { data, error } = await supabase
    .from("schools")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (error) {
    console.error("School lookup error:", error)
    return null
  }

  console.log("School found:", data)

  return data?.id || null
}