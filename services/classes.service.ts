import { supabase } from "@/lib/supabase"

export async function getClasses(schoolId: string) {

  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("school_id", schoolId)
    .order("name")

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createClass(cls: any) {

  const { error } = await supabase
    .from("classes")
    .insert(cls)

  if (error) {
    console.error(error)
  }

}