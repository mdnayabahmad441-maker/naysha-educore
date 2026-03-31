import { supabase } from "./supabase"
import { getSchoolId } from "./school"

// ================= GET SETTINGS =================
export async function getSettings(key: string) {

  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return null

    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("school_id", schoolId)
      .eq("key", key)
      .maybeSingle()

    if (error) {
      console.error("❌ Settings fetch error:", error)
      return null
    }

    return data?.value || null

  } catch (err) {
    console.error("❌ getSettings crash:", err)
    return null
  }
}

// ================= UPDATE SETTINGS =================
export async function updateSettings(key: string, value: any) {

  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return

    const { error } = await supabase
      .from("settings")
      .upsert(
        {
          school_id: schoolId,
          key,
          value
        },
        {
          onConflict: "school_id,key" // 🔥 FIXED
        }
      )

    if (error) {
      console.error("❌ Settings update error:", error)
    }

  } catch (err) {
    console.error("❌ updateSettings crash:", err)
  }
}