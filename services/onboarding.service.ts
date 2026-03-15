import { supabase } from "@/lib/supabase"

export async function createSchool(userId:string,name:string,slug:string){

  const schoolId = crypto.randomUUID()

  const {error:schoolError} = await supabase
    .from("schools")
    .insert({
      id:schoolId,
      name,
      slug
    })

  if(schoolError){
    console.error(schoolError)
    return
  }

  const {error:userError} = await supabase
    .from("users")
    .update({
      school_id:schoolId,
      role:"school_admin"
    })
    .eq("id",userId)

  if(userError) console.error(userError)

}