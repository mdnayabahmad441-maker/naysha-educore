import { supabase } from "@/lib/supabase"

export async function getStudents() {

  const { data, error } = await supabase
    .from("students")
    .select(`
      id,
      name,
      email,
      classes(name),
      sections(name)
    `)

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createStudent(student:any){

  const { error } = await supabase
    .from("students")
    .insert(student)

  if(error) console.error(error)

}