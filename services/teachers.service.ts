import { supabase } from "@/lib/supabase"

export async function getTeachers(){

  const {data,error} = await supabase
    .from("teachers")
    .select("*")
    .order("name")

  if(error){
    console.error(error)
    return []
  }

  return data

}

export async function createTeacher(teacher:any){

  const {error} = await supabase
    .from("teachers")
    .insert(teacher)

  if(error) console.error(error)

}