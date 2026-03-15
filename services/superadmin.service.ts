import { supabase } from "@/lib/supabase"

export async function getSchools(){

  const {data,error} = await supabase
    .from("schools")
    .select("*")
    .order("created_at")

  if(error){
    console.error(error)
    return []
  }

  return data

}