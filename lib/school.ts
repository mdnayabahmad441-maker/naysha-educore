"use client"

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

    // ✅ BLOCK INVALID SUBDOMAINS
    if (["www", "erp", "naysha"].includes(subdomain)) {
      console.warn("Invalid subdomain:", subdomain)
      return null
    }

    // ✅ SAFE QUERY
    const { data, error } = await supabase
      .from("schools")
      .select("id")
      .eq("subdomain", subdomain)
      .maybeSingle()

    if (error) {
      console.error("School fetch error:", error)
      return null
    }

    if (!data) {
      console.warn("No school found for subdomain:", subdomain)
      return null
    }

    cachedSchoolId = data.id
    return data.id

  } catch (err) {
    console.error("School error:", err)
    return null
  }
}