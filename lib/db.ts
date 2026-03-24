import { supabase } from "./supabase"
import { getSchoolId } from "./school"

// 🔥 UNIVERSAL SELECT
export async function dbGet(table: string) {

  const schoolId = await getSchoolId()
  if (!schoolId) {
    console.error("No schoolId")
    return []
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("school_id", schoolId)

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}


// 🔥 UNIVERSAL INSERT
export async function dbInsert(table: string, payload: any) {

  const schoolId = await getSchoolId()
  if (!schoolId) {
    console.error("No schoolId")
    return null
  }

  const { data, error } = await supabase
    .from(table)
    .insert([
      {
        ...payload,
        school_id: schoolId
      }
    ])
    .select()

  if (error) {
    console.error(error)
    return null
  }

  return data
}


// 🔥 UNIVERSAL UPDATE
export async function dbUpdate(table: string, id: string, payload: any) {

  const schoolId = await getSchoolId()

  const { error } = await supabase
    .from(table)
    .update(payload)
    .eq("id", id)
    .eq("school_id", schoolId)

  if (error) console.error(error)
}


// 🔥 UNIVERSAL DELETE
export async function dbDelete(table: string, id: string) {

  const schoolId = await getSchoolId()

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId)

  if (error) console.error(error)
}