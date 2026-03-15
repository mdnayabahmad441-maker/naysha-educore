import { supabase } from "@/lib/supabase"

export async function getStudents(schoolId:string){

  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("school_id", schoolId)

  if(error){
    console.error(error)
    return []
  }

  return data
}

export async function addStudent(student:any){

  const { data, error } = await supabase
    .from("students")
    .insert([student])

  if(error){
    console.error(error)
  }

  return data
}