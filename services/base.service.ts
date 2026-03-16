import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export async function getAll(table:string){

  const schoolId = await getSchoolId()

  if(!schoolId) return []

  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("school_id",schoolId)

  return data || []
}

export async function createItem(table:string,data:any){

  const schoolId = await getSchoolId()

  if(!schoolId) return

  const { error } = await supabase
    .from(table)
    .insert({
      ...data,
      school_id:schoolId
    })

  if(error){
    console.error(error)
  }
}