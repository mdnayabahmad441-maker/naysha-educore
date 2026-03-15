import { supabase } from "@/lib/supabase"

export async function getClassSubjects() {

  const { data, error } = await supabase
    .from("class_subjects")
    .select(`
      id,
      classes(name),
      subjects(name)
    `)

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createClassSubject(data: any) {

  const { error } = await supabase
    .from("class_subjects")
    .insert(data)

  if (error) console.error(error)

}