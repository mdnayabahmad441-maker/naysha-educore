import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export async function getAll(table: string) {

  const schoolId = await getSchoolId()

  console.log("SchoolId:", schoolId)

  if (!schoolId) {
    console.warn("No school id detected")
    return []
  }

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("school_id", schoolId)

  if (error) {
    console.error("GET ERROR:", error)
    return []
  }

  console.log("GET RESULT:", data)

  return data || []
}

export async function createItem(table: string, data: any) {

  const schoolId = await getSchoolId()

  console.log("SchoolId:", schoolId)

  if (!schoolId) {
    console.warn("No school id detected")
    return null
  }

  const { data: result, error } = await supabase
    .from(table)
    .insert([
      {
        ...data,
        school_id: schoolId
      }
    ])
    .select()

  if (error) {
    console.error("INSERT ERROR:", error)
    return null
  }

  console.log("INSERT RESULT:", result)

  return result
}