import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export const getClasses = async () => {

  const schoolId = await getSchoolId()

  console.log("Using schoolId:", schoolId)

  if (!schoolId) return []

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)

  if (error) {
    console.error("Classes fetch error:", error)
    return []
  }

  console.log("Filtered Classes:", data)

  return data || []
}