import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export const getStudents = async () => {

  const schoolId = await getSchoolId()

  console.log("Students fetch schoolId:", schoolId)

  if (!schoolId) return []

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId)

  if (error) {
    console.error("Students fetch error:", error)
    return []
  }

  console.log("Filtered students:", data)

  return data || []
}