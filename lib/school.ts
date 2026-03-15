import { supabase } from "@/lib/supabase"

/**
 * Detect school using subdomain
 * Example:
 * alpha.erp.naysha.online → alpha
 */
export async function getSchool(subdomain: string) {

  if (!subdomain) {
    return null
  }

  try {

    const { data, error } = await supabase
      .from("schools")
      .select("*")
      .eq("subdomain", subdomain)
      .single()

    if (error) {
      console.error("School lookup error:", error.message)
      return null
    }

    return data

  } catch (err) {
    console.error("Unexpected school lookup error:", err)
    return null
  }

}