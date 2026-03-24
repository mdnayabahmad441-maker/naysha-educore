import { supabase } from "./supabase"
import { getSchoolId } from "./school"

export async function getSettings(key: string) {

  const schoolId = await getSchoolId()
  if (!schoolId) return null

  const { data } = await supabase
    .from("settings")
    .select("*")
    .eq("school_id", schoolId)
    .eq("key", key)
    .maybeSingle()

  return data?.value || null
}

export async function updateSettings(key: string, value: any) {

  const schoolId = await getSchoolId()
  if (!schoolId) return

  await supabase
    .from("settings")
    .upsert({
      school_id: schoolId,
      key,
      value
    })
}