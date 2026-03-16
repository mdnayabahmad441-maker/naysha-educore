import { supabase } from "@/lib/supabase"

export async function getSchoolId() {

  const { data: sessionData } = await supabase.auth.getSession()

  const userId = sessionData?.session?.user?.id

  if (!userId) return null

  const { data } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", userId)
    .single()

  return data?.school_id || null
}