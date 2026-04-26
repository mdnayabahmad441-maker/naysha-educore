import { supabaseAdmin } from "./supabase-admin"

export async function getSchoolFromRequest(req: Request) {
  try {
    // Get hostname from request
    const host = req.headers.get("host") || ""
    const parts = host.split(".")

    // example: patna.naysha.online
    const subdomain = parts[0]

    // ignore main domain
    if (
      subdomain === "erp" ||
      subdomain === "www" ||
      host.includes("localhost") ||
      host.includes("127.0.0.1")
    ) {
      return null
    }

    const { data, error } = await supabaseAdmin
      .from("schools")
      .select("*")
      .or(`subdomain.eq.${subdomain},domain.eq.${subdomain}`)
      .single()

    if (error) {
      console.error("School detection error:", error)
      return null
    }

    return data
  } catch (err) {
    console.error("School detection failed:", err)
    return null
  }
}
