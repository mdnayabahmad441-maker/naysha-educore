import { supabase } from "@/lib/supabase"

export async function getSchoolBySlug(slug:string){

  const { data } = await supabase
    .from("schools")
    .select("*")
    .eq("slug",slug)
    .single()

  return data
}