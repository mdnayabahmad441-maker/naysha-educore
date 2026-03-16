import { headers } from "next/headers"
import { supabase } from "./supabase"

export async function getSchoolId() {

  const headersList = await headers()

  const host = headersList.get("host") || ""

  // abc123.naysha.online → abc123
  const subdomain = host.split(".")[0]

  if (!subdomain) return null

  const { data } = await supabase
    .from("schools")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle()

  return data?.id || null
}