import { supabase } from "@/lib/supabase"

export async function getExams(){

  const {data,error} = await supabase
    .from("exams")
    .select(`
      id,
      name,
      exam_date,
      classes(name)
    `)

  if(error){
    console.error(error)
    return []
  }

  return data

}

export async function createExam(exam:any){

  const {error} = await supabase
    .from("exams")
    .insert(exam)

  if(error) console.error(error)

}