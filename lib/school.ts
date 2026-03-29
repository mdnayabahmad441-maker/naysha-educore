import { supabase } from "./supabase"

let cachedSchoolId: string | null = null

export async function getSchoolId() {

  if (cachedSchoolId) return cachedSchoolId

  if (typeof window === "undefined") return null

  const host = window.location.hostname
  let subdomain = host.split(".")[0]

  // LOCAL + ROOT FIX
  if (host.includes("localhost") || subdomain === "www" || subdomain === "erp") {
    subdomain = "default"
  }

  console.log("SUBDOMAIN:", subdomain)

  // 🔍 TRY FIND SCHOOL
  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .maybeSingle()

  if (error) {
    console.error("Fetch error:", error)
  }

  // ✅ FOUND
  if (data) {
    cachedSchoolId = data.id
    return data.id
  }

  console.warn("School not found → creating new one...")

  // 🔥 AUTO CREATE SCHOOL
  const { data: newSchool, error: insertError } = await supabase
    .from("schools")
    .insert({
      name: subdomain.toUpperCase() + " School",
      subdomain: subdomain
    })
    .select()
    .single()

  if (insertError) {
    console.error("Create school error:", insertError)
    return null
  }

  cachedSchoolId = newSchool.id

  console.log("New school created:", newSchool)

  return newSchool.id
}