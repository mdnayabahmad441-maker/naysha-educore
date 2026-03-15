import { headers } from "next/headers"
import { supabase } from "./supabase"

export async function getSchool(){

  const headersList = await headers()

  const host =
    headersList.get("x-forwarded-host") ||
    headersList.get("host") ||
    ""

  const parts = host.split(".")

  if(parts.length < 3){
    throw new Error("Invalid domain")
  }

  const subdomain = parts[0]

  const { data: school, error } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .single()

  if(error || !school){
    throw new Error("School not found")
  }

  return school
}