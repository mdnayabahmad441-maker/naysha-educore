import { supabase } from "./supabase"

export async function getUserRole() {

  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) return null

  const { data, error } = await supabase
    .from("profiles")
    .select("role, school_id")
    .eq("id", userData.user.id)
    .single()

  if (error || !data) return null

  return data
}