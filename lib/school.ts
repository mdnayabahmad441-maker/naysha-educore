import { supabase } from "./supabase"

export async function getSchoolId() {

  const { data } = await supabase
    .from("schools")
    .select("id")
    .limit(1)
    .single()

  return data?.id || null
}