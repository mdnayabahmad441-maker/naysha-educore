import { supabase } from "@/lib/supabase"

export async function getSubjects() {

  const { data, error } = await supabase
    .from("subjects")
    .select("*")
    .order("name")

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createSubject(subject: any) {

  const { error } = await supabase
    .from("subjects")
    .insert(subject)

  if (error) {
    console.error(error)
  }

}