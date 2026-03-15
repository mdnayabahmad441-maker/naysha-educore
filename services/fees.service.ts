import { supabase } from "@/lib/supabase"

export async function getFees() {

  const { data, error } = await supabase
    .from("fees")
    .select("*")
    .order("name")

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createFee(fee:any){

  const { error } = await supabase
    .from("fees")
    .insert(fee)

  if(error) console.error(error)

}