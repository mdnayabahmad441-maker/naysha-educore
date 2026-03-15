import { supabase } from "@/lib/supabase"
import { getSchool } from "@/lib/school"

export async function getSessionContext() {

  const { data: sessionData } = await supabase.auth.getSession()

  const session = sessionData.session

  if (!session) {
    return null
  }

  const userId = session.user.id

  // get user info
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (!user) {
    return null
  }

  // get school
  const { data: school } = await supabase
    .from("schools")
    .select("*")
    .eq("id", user.school_id)
    .single()

  return {
    session,
    user,
    school
  }

}