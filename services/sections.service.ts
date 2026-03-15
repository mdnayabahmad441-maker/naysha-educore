import { supabase } from "@/lib/supabase"

export async function getSections() {

  const { data, error } = await supabase
    .from("sections")
    .select("*")
    .order("name")

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createSection(section: any) {

  const { error } = await supabase
    .from("sections")
    .insert(section)

  if (error) {
    console.error(error)
  }

}