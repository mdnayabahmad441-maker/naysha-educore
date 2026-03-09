import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getSchoolBySubdomain(subdomain: string) {

  const { data, error } = await supabase
    .from("schools")
    .select("*")
    .eq("subdomain", subdomain)
    .single()

  if (error) {
    throw new Error("School not found")
  }

  return data
}