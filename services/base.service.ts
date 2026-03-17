import { supabase } from "@/lib/supabase"
import { getSchoolId } from "@/lib/school"

export async function getAll(table:string){

  const schoolId = await getSchoolId()

  console.log("SchoolId:", schoolId)

  if(!schoolId) return []

  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("school_id",schoolId)

  console.log("GET RESULT:", data, error)

  return data || []
}

export async function createItem(table:string,data:any){

  const schoolId = await getSchoolId()

  console.log("SchoolId:", schoolId)

  if(!schoolId){
    console.log("No school id detected")
    return
  }

  const { data:result, error } = await supabase
    .from(table)
    .insert({
      ...data,
      school_id:schoolId
    })
    .select()

  console.log("INSERT RESULT:", result, error)

  return result
}