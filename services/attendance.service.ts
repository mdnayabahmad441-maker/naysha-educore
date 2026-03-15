import { supabase } from "@/lib/supabase"

export async function saveAttendance(rows:any[]){

  const {error} = await supabase
    .from("attendance")
    .insert(rows)

  if(error) console.error(error)

}

export async function getAttendance(date:string){

  const {data,error} = await supabase
    .from("attendance")
    .select("*")
    .eq("date",date)

  if(error){
    console.error(error)
    return []
  }

  return data

}