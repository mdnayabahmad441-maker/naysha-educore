// lib/academic.ts

import { supabase } from "./supabase"
import { getSchoolId } from "./school"

export const getActiveAcademicYear = async () => {

  const schoolId = await getSchoolId()

  const { data } = await supabase
    .from("academic_years")
    .select("*")
    .eq("school_id", schoolId)
    .eq("is_active", true)
    .maybeSingle()

  return data
}