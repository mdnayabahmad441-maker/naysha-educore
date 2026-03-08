import { supabase } from "./supabase"

export async function getSchool() {

  if (typeof window === "undefined") return null

  const host = window.location.hostname

  // example: greenvalley.naysha.online
  const subdomain = host.split(".")[0]

  const { data } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .single()

  return data

}