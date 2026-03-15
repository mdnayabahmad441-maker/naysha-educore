import { supabase } from "@/lib/supabase"

export async function getExamSubjects(examId:string){

  const {data,error} = await supabase
    .from("exam_subjects")
    .select(`
      id,
      max_marks,
      subjects(name)
    `)
    .eq("exam_id",examId)

  if(error){
    console.error(error)
    return []
  }

  return data
}

export async function addExamSubject(data:any){

  const {error} = await supabase
    .from("exam_subjects")
    .insert(data)

  if(error) console.error(error)

}