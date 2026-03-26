import { supabase } from "./supabase"
import { getSchoolId } from "./school"

// =========================
// 🔥 UNIVERSAL SELECT
// =========================
export async function dbGet(table: string) {

  try {

    const schoolId = await getSchoolId()

    if (!schoolId) {
      console.error("❌ No schoolId")
      return []
    }

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("school_id", schoolId)

    if (error) {
      console.error(`❌ DB GET ERROR (${table}):`, error.message)
      return []
    }

    return data || []

  } catch (err: any) {
    console.error(`❌ DB GET FAILED (${table}):`, err.message)
    return []
  }
}


// =========================
// 🔥 UNIVERSAL INSERT
// =========================
export async function dbInsert(table: string, payload: any) {

  try {

    const schoolId = await getSchoolId()

    if (!schoolId) {
      console.error("❌ No schoolId")
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
      console.error(`❌ DB INSERT ERROR (${table}):`, error.message)
      alert(error.message)
      return null
    }

    return data

  } catch (err: any) {
    console.error(`❌ DB INSERT FAILED (${table}):`, err.message)
    alert(err.message)
    return null
  }
}


// =========================
// 🔥 UNIVERSAL UPDATE (FIXED)
// =========================
export async function dbUpdate(table: string, id: string, payload: any) {

  try {

    const schoolId = await getSchoolId()

    if (!schoolId) {
      console.error("❌ No schoolId")
      return null
    }

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq("id", id)
      .eq("school_id", schoolId)
      .select()

    if (error) {
      console.error(`❌ DB UPDATE ERROR (${table}):`, error.message)
      alert(error.message)
      return null
    }

    if (!data || data.length === 0) {
      console.error(`❌ DB UPDATE FAILED (${table}): No rows updated`)
      alert("Update failed")
      return null
    }

    return data[0]

  } catch (err: any) {
    console.error(`❌ DB UPDATE CRASH (${table}):`, err.message)
    alert(err.message)
    return null
  }
}


// =========================
// 🔥 UNIVERSAL DELETE (FIXED)
// =========================
export async function dbDelete(table: string, id: string) {

  try {

    const schoolId = await getSchoolId()

    if (!schoolId) {
      console.error("❌ No schoolId")
      return false
    }

    const { error } = await supabase
      .from(table)
      .delete()
      .eq("id", id)
      .eq("school_id", schoolId)

    if (error) {
      console.error(`❌ DB DELETE ERROR (${table}):`, error.message)
      alert(error.message)
      return false
    }

    return true

  } catch (err: any) {
    console.error(`❌ DB DELETE FAILED (${table}):`, err.message)
    alert(err.message)
    return false
  }
}