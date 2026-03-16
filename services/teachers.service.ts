import { supabase } from "@/lib/supabase"

export async function getTeachers() {

  const { data: sessionData } = await supabase.auth.getSession()

  const userId = sessionData?.session?.user?.id

  if (!userId) return []

  const { data: user } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", userId)
    .single()

  if (!user) return []

  const { data } = await supabase
    .from("teachers")
    .select("*")
    .eq("school_id", user.school_id)

  return data || []
}


export async function createTeacher(teacher:any) {

  const { data: sessionData } = await supabase.auth.getSession()

  const userId = sessionData?.session?.user?.id

  if (!userId) return

  const { data: user } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", userId)
    .single()

  if (!user) return

  const { error } = await supabase
    .from("teachers")
    .insert({
      ...teacher,
      school_id: user.school_id
    })

  if (error) {
    console.error("Teacher insert error:", error)
  }
}