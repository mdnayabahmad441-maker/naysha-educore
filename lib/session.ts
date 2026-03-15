import { supabase } from "@/lib/supabase"
import { getSchool } from "@/lib/school"

export async function getSessionContext(){

  const school = await getSchool()

  /* GET AUTH USER */

  const { data:userData } = await supabase.auth.getUser()

  const authUser = userData.user

  if(!authUser){
    throw new Error("User not logged in")
  }

  /* GET ERP USER */

  const { data:user } =
  await supabase
  .from("users")
  .select("*")
  .eq("id",authUser.id)
  .single()

  return {

    school,
    user,
    role:user?.role

  }

}